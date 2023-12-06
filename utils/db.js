import { MongoClient } from 'mongodb';

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 27017;
const database = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${host}:${port}/${database}`;

class DBClient {
  constructor() {
    console.log('MongoDB Connection String:', url);
    MongoClient.connect(`${url}`, { useUnifiedTopology: true }, (err, client) => {
      if (!err) {
        this.db = client.db(database);
        this.users = this.db.collection('users');
        this.files = this.db.collection('files');
      } else {
        console.log(`Error: ${err}`);
        this.db = false;
      }
    });
  }

  isAlive() {
    return Boolean(this.db);
  }

  async nbUsers() {
    const numDocs = this.users.countDocuments();
    return numDocs;
  }

  async nbFiles() {
    const numFiles = this.files.countDocuments();
    return numFiles;
  }
}

const dbClient = new DBClient();

export default dbClient;
