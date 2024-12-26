import { Request, Response, Router } from 'express';

import { AmqpManager } from './amqp.js';
import { ConfigManager } from './config.js';
import { initLog } from './console.log.js';
import { cwd as CWD } from './cwd.js';
import { ExpressManager } from './express.js';
import { CustomLogger, LoggerManager } from './logger.js';
import { DbManager } from './mongodb.js';

// Core Application
export abstract class Core {
  protected config: ConfigManager;
  protected logger: CustomLogger;
  protected amqpManager: AmqpManager;
  protected dbManager: DbManager;
  protected expressManager: ExpressManager;

  public constructor() {
    if (new.target === Core) {
      throw new Error(
        '[core] cannot be instantiated directly. Please extend it.'
      );
    }
    globalThis.cwd = CWD;
    this.config = new ConfigManager();
    this.logger = new LoggerManager().getLogger();
    globalThis.configs = this.config;
    initLog(configs.Args.debug, this.logger);
    this.amqpManager = new AmqpManager();
    this.dbManager = new DbManager();
    this.expressManager = new ExpressManager();

    this.Main();
  }

  protected abstract Main(): void;
}

// Test
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
new (class extends Core {
  public Main(): void {
    if (configs.Args.test) {
      console.log('[core] ~{19}`Application is starting`...');
      console.log('[core warn] test');
      console.log('[error] some err');
      void (async (): Promise<void> => {
        await this.dbManager.connect('t1_test');

        await this.expressManager.start();

        const router = Router();

        router.get('/test', (_req: Request, res: Response) => {
          res.status(200).send('hi');
        });

        void this.expressManager.addRoute('/', router);

        const sampleData = {
          name: 'John',
          age: 30,
          address: {
            city: 'NYC',
            zip: '10001',
          },
        };

        await this.dbManager.saveData(sampleData);

        await this.dbManager.fetchData({ age: { $gt: 20 } });

        // unique
        const id2 = await this.dbManager.saveData({ name: 'Bob', age: 25 });
        await this.dbManager.fetchDataById(id2);

        await this.dbManager.updateDataById(id2, {
          age: 31,
          newLine: 'test',
        });
      });
    }
  }
})();
