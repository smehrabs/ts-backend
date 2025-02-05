import { Core } from '5gfi6gdi9/core';
import { Request, Response, Router } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';


/*
const dbManager = new DbManager();
await dbManager.connect();

// ایجاد نقش
const adminRole = await dbManager.createRole('Admin');

// ایجاد دسترسی
const readPermission = await dbManager.createPermission('Read', adminRole._id);
const writePermission = await dbManager.createPermission('Write', adminRole._id);

// ایجاد کاربر
const user = await dbManager.createUser('john_doe', [readPermission._id, writePermission._id]);

await dbManager.close();

//

const userWithPermissions = await UserModel.findById(user._id).populate('permissions');
console.log(userWithPermissions);


*/

export default async function (core: Core) {
  try {
    await core.dbManager.connect('gl_auth');
    await core.expressManager.start();

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

      const { user, password }: { user: string; password: string } = value;

      const exists = await core.dbManager.isUniqueFieldExists('user', user);
      if (exists !== null) {
        res.status(500).send('user already exists');
      } else {
        await core.dbManager.saveData({ user: user, password: password });
        res.status(200).send('signed');
      }

      return res;
    });

    const accessPass = core.config.EnvConfig.SECRET_KEY + ':access';

    router.post('/login', async (req: Request, res: Response | any) => {
      const { error, value } = validateUserInput(req.body);
      if (error) {
        return res
          .status(400)
          .json({ status: 400, message: error.details[0].message });
      }

      const { user, password }: { user: string; password: string } = value;

      const exists = await core.dbManager.isUniqueFieldExists('user', user);
      if (exists !== null) {
        if (exists.password === password) {
          const accessToken = jwt.sign({ user: user }, accessPass, {
            expiresIn: '30d',
          });
          res.status(200).json({ accessToken });
        } else {
          res.status(500).send('wrong password');
        }
      } else {
        res.status(500).send('user not found');
      }

      return res;
    });

    // const checkAdmin = (req: any, res: any, next: any) => {
    //   const token = req.headers['authorization']?.split(' ')[1];

    //   if (!token) {
    //     return res.status(403).json({ message: 'Access denied' });
    //   }

    //   jwt.verify(token, accessPass, async (err: any, decoded: any) => {
    //     if (err) {
    //       return res.status(403).json({ message: 'Invalid token' });
    //     }

    //     const exists = await core.dbManager.isUniqueFieldExists(
    //       'user',
    //       decoded.user
    //     );
    //     if (exists !== null) {
    //       next();
    //     } else {
    //       res.status(403).json({ message: 'user not found' });
    //     }
    //   });
    // };

    // const access = (token: string, access: string): boolean => {
    //   let res: boolean = false;
    //   jwt.verify(token, accessPass, async (err: any, decoded: any) => {
    //     if (err) {
    //       res = false;
    //     }

    //     const exists = await core.dbManager.isUniqueFieldExists(
    //       'user',
    //       decoded.user
    //     );
    //     if (exists !== null) {
    //       if (exists[access] === true) {
    //         res = true;
    //       } else {
    //         res = false;
    //       }
    //     } else {
    //       res = false;
    //     }
    //   });
    //   return res;
    // };

    router.get('/', (_req: Request, res: Response) => {
      res.status(200).send('hi');
    });

    void core.expressManager.addRoute('/', router);

    // const sampleData = {
    //   name: 'John',
    //   age: 30,
    //   address: {
    //     city: 'NYC',
    //     zip: '10001',
    //   },
    // };

    // await core.dbManager.saveData(sampleData);

    // await core.dbManager.fetchData({ age: { $gt: 20 } });

    // // unique
    // const id2 = await core.dbManager.saveData({ name: 'Bob', age: 25 });
    // await core.dbManager.fetchDataById(id2);

    // await core.dbManager.updateDataById(id2, {
    //   age: 31,
    //   newLine: 'test',
    // });
  } catch (err) {
    console.log('[error] ' + err);
  }
}
