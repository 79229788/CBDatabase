const _ = require('lodash');
const CB = require('./database');
const config_postgres = require('./config/postgres');
const config_oss = require('./config/oss');
const config_redis = require('./config/redis');
const config_tables = require('./config/tables');
const http = require('http');
const moment = require('moment');

CB.initPG({
  host            : config_postgres.postgres.host,
  port            : config_postgres.postgres.port,
  user            : config_postgres.postgres.user,
  password        : config_postgres.postgres.password,
  database        : 'test',
  tableList       : config_tables.tables,
  checkTable      : true,
  printSql        : true,
  printSqlParams  : true
});
CB.initOSS({
  endpoint        : config_oss.oss.endpoint,
  accessKeyId     : config_oss.oss.accessKeyId,
  accessKeySecret : config_oss.oss.accessKeySecret,
  bucket          : config_oss.oss.bucket,
});
CB.initSessionRedis({
  host          : config_redis.redis.sessionRedis.host,
  port          : config_redis.redis.sessionRedis.port,
  password      : config_redis.redis.sessionRedis.password,
});

const Table1 = CB.Object.extend('Table1');
const Table2 = CB.Object.extend('Table2');
const Table3 = CB.Object.extend('Table3');

const query = new CB.Query(Table1);
query.select('name', 'table');
query.include('table', Table2, null, {selects: ['name', 'table']});
query.include('table.table', Table3, null, {selects: ['name']});
query.first().then(data => {
  console.log('@@@@@@@@@@@');
  console.log(data.toOrigin());
}).catch(error => {
  console.log(error);
});


//******************** 测试数据创建
//********************
// const table3 = new Table3();
// table3.set('name', '表格三');
// table3.set('time', moment().format('YYYY-MM-DD HH:mm:ss'));
// table3.set('boolean', true);
// table3.set('number', 30);
// table3.set('array', ['i', 'j', 'k', 'l']);
//
// const table2 = new Table2();
// table2.set('name', '表格二');
// table2.set('time', moment().format('YYYY-MM-DD HH:mm:ss'));
// table2.set('boolean', false);
// table2.set('number', 20);
// table2.set('array', ['e', 'f', 'g', 'h']);
// table2.set('table', table3);
//
// const table1 = new Table1();
// table1.set('name', '表格一');
// table1.set('time', moment().format('YYYY-MM-DD HH:mm:ss'));
// table1.set('boolean', true);
// table1.set('number', 10);
// table1.set('array', ['a', 'b', 'c', 'd']);
// table1.set('table', table2);
//
// table1.save().then(data => {
//   console.log(data);
// }).catch(error => {
//   console.log(error);
// });


//******************** 测试数据查询
//********************
//********关联查询
// const query = new CB.Query(Table1);
// query.equalTo('name', '表格一');
// query.equalTo('boolean', true);
// query.include('table', Table2);
// query.include('table.table', Table3);
// query.first().then(data => {
//   if(!data) return console.log('未查询到数据');
//   console.log(data.toOrigin());
// }).catch(error => {
//   console.log(error);
// });


//********内嵌查询
// //内嵌查询
// const innerQuery = new CB.InnerQuery(Table2);
// innerQuery.equalTo('name', '表格二2');
// innerQuery.equalTo('boolean', false);
// //主查询
// const query = new CB.Query(Table1);
// query.equalTo('name', '表格一');
// query.equalTo('boolean', true);
// query.includeQuery('table', innerQuery);
// query.first().then(data => {
//   if(!data) return console.log('未查询到数据');
//   console.log(data.toOrigin());
// }).catch(error => {
//   console.log(error);
// });


// CB.Cloud.Batch(async (client) => {
//   const query = new CB.Query(Table1);
//   const table = await query.get('BylENTepUQ', client);
//   // const table = new Table1();
//   // table.id = 'BylENTepUQ';
//   table.set('file', CB.File.withURL('image', 'http://img3.xx.jpg'));
//   const data = await table.save(client);
//   console.log(data.toOrigin());
// });

//********删除数据
// CB.Cloud.Transaction(async (client) => {
//   const table1 = new Table1();
//   //table1.id = 'ryZjpzD7fm';
//   table1.setQuery(new CB.Query().equalTo('name', '表格一'));
//   table1.setReturnKeys(['table']);
//   const data = await table1.destroy(client);
//   console.log('ok', data[0].get('table'));
//   throw new Error('force error');
// }).catch(error => {
//   console.log(error);
// });




