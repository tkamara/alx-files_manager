import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const userExists = await dbClient.users.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPwd = sha1(password);
    const newUser = {
      email,
      password: hashedPwd,
    };

    const stored = await dbClient.users.insertOne(newUser);
    return res.status(201).json({ email: stored.ops[0].email, id: stored.insertedId });
  }

  static async getMe(req, res) {
    const token = req.header('X-Token');

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json('Unauthorized');
    }

    const idObject = new ObjectId(userId);
    const userExist = await dbClient.users.findOne({ _id: idObject });

    return res.json({ id: userId, email: userExist.email });
  }
}

export default UsersController;
