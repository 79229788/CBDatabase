const _ = require('lodash');
const CB = require('./database');
const config = require('./config/servertables');

module.exports = function () {
  (async () => {
    const client = await CB.pg.connect();
    try {
      await client.query('BEGIN');
      const tables = await CB.table.getTableNames('public', client);
      for(let table of config.tables) {
        //*****当表不存在时，创建表
        if(tables.indexOf(table.name) < 0) {
          if(CB.pgConfig.printSql) console.log(`[check database table] create table ${table.name}`);
          await CB.table.createTable('public', table.name, table.columns, client);
        }
        //*****当表存在时，继续检查列，没有就创建列
        else {
          const columns = await CB.table.getColumnNames('public', table.name, client);
          for(let column of table.columns) {
            if(columns.indexOf(column.name) < 0) {
              if(CB.pgConfig.printSql) console.log(`[check database table] create column ${table.name} -> ${column.name}`);
              await CB.table.createColumn('public', table.name, column, client);
            }
          }
        }
      }
      console.log('[check database table] completion');
      await client.query('COMMIT');
    }catch (error) {
      await client.query('ROLLBACK');
      console.log(error);
    }finally {
      client.release();
    }
  })().catch((error) => {
    console.log('[check database table error]', error.message);
  });

};