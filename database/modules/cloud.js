const CB = require('./cb');
const cookieSession = require('../middlewares/session');

CB.Cloud = {
  CookieSession: cookieSession(CB),
  /**
   * 事务操作
   * @param cb
   * @return {Promise.<void>}
   * @constructor
   */
  Transaction: async function (cb) {
    const client = await CB.pg.connect();
    try {
      await client.query('BEGIN');
      await cb(client);
      await client.query('COMMIT');
    }catch (error) {
      await client.query('ROLLBACK');
      throw new Error(error);
    }finally {
      client.release();
    }
  },
  /**
   * 批量操作
   * @return {Promise.<void>}
   * @constructor
   */
  Batch: async function (cb) {
    const client = await CB.pg.connect();
    try {
      await cb(client);
    }catch (error) {
      throw new Error(error);
    }finally {
      client.release();
    }
  }
};
