import redis from 'redis';
import util from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.on('error', (err) => {
      console.log(`Error: ${err}`);
    });
  }
// update on isAlive
  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const getValue = util.promisify(this.client.get).bind(this.client);
    const value = await getValue(key);
    return value;
  }

  async set(key, value, time) {
    const setValue = util.promisify(this.client.set).bind(this.client);
    const expire = util.promisify(this.client.expire).bind(this.client);
    await setValue(key, value);
    if (time) {
      await expire(key, time);
    }
  }

  async del(key) {
    const deleteValue = util.promisify(this.client.del).bind(this.client);
    await deleteValue(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
