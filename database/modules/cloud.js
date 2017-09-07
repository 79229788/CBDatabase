const CB = require('./cb');
const cookieSession = require('../middlewares/session');

CB.Cloud = {
  CookieSession: cookieSession(CB),
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
  }
};
