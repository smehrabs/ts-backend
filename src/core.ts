import { Request, Response, Router } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';

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
    if (configs.Args.authorization) {
      console.log('[core] ~{19}`Application is starting`...');
      console.log('[warn] authorization');
      const init = async (): Promise<void> => {
        try {
          await this.dbManager.connect('gl_auth');

          await this.expressManager.start();

          const router = Router();

          const validateUserInput = (data: any) => {
            const schema = Joi.object({
              user: Joi.string().required(),
              password: Joi.string().required(),
            }).unknown();

            return schema.validate(data);
          };

          router.post('/signup', async (req: Request, res: Response | any) => {
            const { error, value } = validateUserInput(req.body);
            if (error) {
              return res
                .status(400)
                .json({ status: 400, message: error.details[0].message });
            }

            const { user, password }: { user: string; password: string } =
              value;

            const exists = await this.dbManager.isUniqueFieldExists(
              'user',
              user
            );
            if (exists !== null) {
              res.status(500).send('user already exists');
            } else {
              await this.dbManager.saveData({ user: user, password: password });
              res.status(200).send('signed');
            }

            return res;
          });

          const accessPass = this.config.EnvConfig.SECRET_KEY + ':access';

          router.post('/login', async (req: Request, res: Response | any) => {
            const { error, value } = validateUserInput(req.body);
            if (error) {
              return res
                .status(400)
                .json({ status: 400, message: error.details[0].message });
            }

            const { user, password }: { user: string; password: string } =
              value;

            const exists = await this.dbManager.isUniqueFieldExists(
              'user',
              user
            );
            if (exists !== null) {
              if (exists.password === password) {
                const accessToken = jwt.sign({ user: user }, accessPass, {
                  expiresIn: '30d',
                });
                res.status(500).json({ accessToken });
              } else {
                res.status(500).send('wrong password');
              }
            } else {
              res.status(500).send('user not found');
            }

            return res;
          });

          router.get('/', (_req: Request, res: Response) => {
            res.status(200).send('hi');
          });

          void this.expressManager.addRoute('/', router);

          // const sampleData = {
          //   name: 'John',
          //   age: 30,
          //   address: {
          //     city: 'NYC',
          //     zip: '10001',
          //   },
          // };

          // await this.dbManager.saveData(sampleData);

          // await this.dbManager.fetchData({ age: { $gt: 20 } });

          // // unique
          // const id2 = await this.dbManager.saveData({ name: 'Bob', age: 25 });
          // await this.dbManager.fetchDataById(id2);

          // await this.dbManager.updateDataById(id2, {
          //   age: 31,
          //   newLine: 'test',
          // });
        } catch (err) {
          console.log('[error] ' + err);
        }
      };
      void init();
    }
  }
})();
