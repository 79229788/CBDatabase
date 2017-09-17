const _ = require('lodash');
const CB = require('../modules/cb');

module.exports = function (tableList) {
  if(tableList.length === 0) return;
  (async () => {
    const client = await CB.pg.connect();
    try {
      await client.query('BEGIN');
      const cfgTableNames = [];
      const curTableNames = await CB.table.getTableNames('public', client);
      const tableGroup = _.groupBy(tableList, item => item.parent ? 'nests' : 'indeps');
      const cfgTables = (tableGroup.indeps || []).concat((tableGroup.nests || []).sort((itemA, itemB) => itemA.parent && itemA.parent === itemB.name));
      for(let table of cfgTables) {
        cfgTableNames.push(table.name);
        //*****当表不存在时，创建表
        if(curTableNames.indexOf(table.name) < 0) {
          console.log(`[check database table] create table ${table.name}`);
          table.columns.forEach((column) => {
            console.log(`---------------------> and create column ${column.name}`);
          });
          if(table.parent) {
            await CB.table.createChildTable('public', table.parent, table.name, table.columns, client);
          }else {
            await CB.table.createTable('public', table.name, table.columns, client);
          }
        }
        //*****当表存在时，继续检查列，没有就创建列
        else {
          const cfgColumnNames = [];
          const curColumnNames = await CB.table.getColumnNames('public', table.name, client);
          for(let column of table.columns) {
            if(curColumnNames.indexOf(column.name) < 0) {
              console.log(`[check database table] create column ${table.name} -> ${column.name}`);
              await CB.table.createColumn('public', table.name, column, client);
            }
          }
          (function getFullCfgColumns(table, tableList) {
            if(table.parent) {
              const parent = _.find(tableList, {name: table.parent});
              getFullCfgColumns(parent, tableList);
            }
            table.columns.forEach(column => {
              if(cfgColumnNames.indexOf(column.name) < 0) {
                cfgColumnNames.push(column.name);
              }
            });
          })(table, tableList);
          const deletedColumnNames = _.difference(curColumnNames, cfgColumnNames);
          if(deletedColumnNames.length > 0) {
            deletedColumnNames.forEach((item) => {
              console.log(`[check database table] The local configuration [${table.name} -> ${item}] field has been deleted, but the cloud is still exist`);
            });
          }
        }
      }
      const deletedTableNames = _.difference(curTableNames, cfgTableNames);
      if(deletedTableNames.length > 0) {
        deletedTableNames.forEach((name) => {
          if(name.indexOf('@_@') < 0) console.log(`[check database table] The local configuration [${name}] table has been deleted, but the cloud is still exist`);
        });
      }
      console.log('[check database table] check completion!');
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
