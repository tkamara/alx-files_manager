import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authorizationHeader = req.header('Authorization');
    if (!authorizationHeader) {
      return res.status(401).json('not header');
    }

    const [technique, credentials] = authorizationHeader.split(' ');
    if (technique !== 'Basic' || !credentials) {
      return res.status(401).json('not splitting auth header');
    }

    const data = Buffer.from(credentials, 'base64').toString('ascii');
    const [userEmail, userPassword] = data.split(':');
    console.log(`${userEmail}`);
    console.log(`${userPassword}`);
    const hashedpwd = sha1(userPassword);
    console.log(`${hashedpwd}`);

    const user = await dbClient.users.findOne({ email: userEmail, password: hashedpwd });
    if (!user) {
      return res.status(401).json('Unauthorized');
    }
    const token = uuidv4();
    const key = `auth_${token}`;
    redisClient.set(key, user._id, 86400);
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json('Unauthorized');
    }

    await redisClient.del(`auth_${token}`);
    return res.status(204);
  }
}

export default AuthController;
