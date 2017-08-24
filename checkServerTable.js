const _ = require('lodash');
const CB = require('./database');
const config = require('./config/servertables');

module.exports = function () {
  (async () => {
    const client = await CB.pg.connect();
    try {
      await client.query('BEGIN');
      const cfgTables = [];
      const curTables = await CB.table.getTableNames('public', client);
      for(let table of config.tables) {
        cfgTables.push(table.name);
        //*****当表不存在时，创建表
        if(curTables.indexOf(table.name) < 0) {
          if(CB.pgConfig.printSql) {
            console.log(`[check database table] create table ${table.name}`);
            table.columns.forEach((column) => {
              console.log(`---------------------> and create column ${column.name}`);
            });
          }
          await CB.table.createTable('public', table.name, table.columns, client);
        }
        //*****当表存在时，继续检查列，没有就创建列
        else {
          const cfgColumns = [];
          const curColumns = await CB.table.getColumnNames('public', table.name, client);
          for(let column of table.columns) {
            cfgColumns.push(column.name);
            if(curColumns.indexOf(column.name) < 0) {
              if(CB.pgConfig.printSql) console.log(`[check database table] create column ${table.name} -> ${column.name}`);
              await CB.table.createColumn('public', table.name, column, client);
            }
          }
          const deletedColumns = _.difference(curColumns, cfgColumns);
          if(deletedColumns.length > 0) {
            deletedColumns.forEach((item) => {
              console.log(`[check database table] The local configuration [${table.name} -> ${item}] field has been deleted, but the cloud is still exist`);
            });
          }
        }
      }
      const deletedTables = _.difference(curTables, cfgTables);
      if(deletedTables.length > 0) {
        deletedTables.forEach((item) => {
          console.log(`[check database table] The local configuration [${item}] table has been deleted, but the cloud is still exist`);
        });
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