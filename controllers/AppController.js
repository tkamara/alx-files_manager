import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    res.status(200).json({
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  });
  }       
        
  static getStats(req, res) {
    try { 
      const userCount = dbClient.nbUsers();
      const fileCount = dbClient.nbFiles();

      return res.status(200).json({ users: userCount, files: fileCount });
    } catch (err) {   
      console.log(`Error getting stats: ${err}`);
    }       
  }       
}       

export default AppController;
