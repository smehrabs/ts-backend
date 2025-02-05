import { AmqpManager } from './amqp.js';
import { ConfigManager } from './config.js';
import { initLog } from './console.log.js';
import { cwd as CWD } from './cwd.js';
import { ExpressManager } from './express.js';
import { CustomLogger, LoggerManager } from './logger.js';
import { DbManager } from './mongodb.js';

import auth from './auth/authorization.js';

export abstract class Core {
  public config: ConfigManager;
  public logger: CustomLogger;
  public amqpManager: AmqpManager;
  public dbManager: DbManager;
  public expressManager: ExpressManager;

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

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
new (class extends Core {
  public Main(): void {
    if (configs.Args.authorization) {
      console.log('[core] ~{19}`We now on authorization`...');
      console.log('[warn] authorization!');
      void auth(this);
    }
  }
})();
