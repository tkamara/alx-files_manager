import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json('Unauthorized');
    }

    const idObject = new ObjectId(userId);
    const userExist = await dbClient.users.findOne({ _id: idObject });
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }

    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }

    const parentIdMon = new ObjectId(parentId);
    if (parentId) {
      const parentFile = await dbClient.files.findOne({ _id: parentIdMon, userId: userExist._id });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileData = {
      userId: idObject,
      name,
      type,
      parentId: parentId ? parentIdMon : 0,
      isPublic: isPublic || false,
    };

    if (type === 'folder') {
      const storefile = await dbClient.files.insertOne(fileData);
      const stored = await dbClient.files.findOne({ _id: storefile.insertedId });
      return res.status(201).json(stored);
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = path.join(folderPath, uuidv4());
    await fs.mkdir(folderPath);
    await fs.writeFile(localPath, Buffer.from(data, 'base64'));
    fileData.localPath = localPath;

    const storefile = await dbClient.files.insertOne(fileData);
    const stored = await dbClient.files.findOne({ _id: storefile.insertedId });
    return res.status(201).json(stored);
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json('Unauthorized');
    }

    const idObject = new ObjectId(userId);
    const userExist = await dbClient.users.findOne({ _id: idObject });

    const fileId = req.params.id;
    const fileIdMongo = new ObjectId(fileId);
    const retrieved = await dbClient.files.findOne({ _id: fileIdMongo, userId: userExist._id });
    if (!retrieved) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.json(retrieved);
  }

  static async getIndex(req, res) {
    const token = req.header('X-Token');
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json('Unauthorized');
    }

    const idObject = new ObjectId(userId);
    const userExist = await dbClient.users.findOne({ _id: idObject });

    const { parentId = '0', page = '0' } = req.query;
    const parentIdMongo = parentId === '0' ? 0 : ObjectId(parentId);
    const maxPage = 20;
    const aggPP = [
      {
        $match: {
          userId: userExist._id,
          parentId: parentIdMongo,
        },
      },
      {
        $skip: parseInt(page, 10) * maxPage,
      },
      {
        $limit: maxPage,
      },
    ];

    const file = await dbClient.files.aggregate(aggPP).toArray();

    return res.json(file);
  }
}

export default FilesController;
