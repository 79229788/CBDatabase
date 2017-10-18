const _ = require('lodash');
const CB = require('./database');
const config_postgres = require('./config/postgres');
const config_oss = require('./config/oss');
const config_redis = require('./config/redis');
const config_tables = require('./config/tables');

CB.initPG({
  host            : config_postgres.postgres.host,
  port            : config_postgres.postgres.port,
  user            : config_postgres.postgres.user,
  password        : config_postgres.postgres.password,
  database        : 'test',
  tableList       : config_tables.tables,
  checkTable      : false,
  printSql        : true,
  printSqlParams  : true
});
CB.initOSS({
  region          : config_oss.oss.region,
  accessKeyId     : config_oss.oss.accessKeyId,
  accessKeySecret : config_oss.oss.accessKeySecret,
  bucket          : 'erp-user-norm',
});
CB.initSessionRedis({
  host          : config_redis.redis.sessionRedis.host,
  port          : config_redis.redis.sessionRedis.port,
  password      : config_redis.redis.sessionRedis.password,
});

const http = require('http');
const Company = CB.Object.extend('Company');
const Product = CB.Object.extend('Product');
const ProductCate = CB.Object.extend('ProductCate');
const ProductPriceMap = CB.Object.extend('ProductPriceMap');
const ProductPriceLevel = CB.Object.extend('ProductPriceLevel');
const ProductPriceAlone = CB.Object.extend('ProductPriceAlone');



const query = new CB.Query(Product);
query.equalInJson('authData', 'wechat.unionId.a', 'b');
query.find().then(data => {
  console.log(data.map(item => item.toOrigin()));
});


// const cate = new ProductCate();
// cate.id = 'Hy8EVjcs-';
// cate.increment('number', 1);
//
// const product = new Product();
// product.set('name', '产品2');
// product.set('cate', cate);
// product.save();


// const query = new CB.Query(ProductCate);
// query.equalTo('objectId', 'HyrqbPZ5b');
// query.equalTo('number', 0);
//
// const cate = new ProductCate();
// cate.id = 'rkWKXVMiZ3';
// //cate.set('name', '分类2');
// cate.setQuery(query);
// cate.destroy().then(data => {
//   console.log(data);
// });

// let index = 0;
// http.createServer( function (req, res) {
//   res.writeHead( 200 , {"Content-Type": "text/html"});
//   res.write("<p>Hello World</p>");
//   //
//   // const query = new CB.Query(ProductCate);
//   // query.equalTo('objectId', 'HyrqbPZ5b');
//   // query.equalTo('number', 0);
//   //
//   const cate = new ProductCate();
//   cate.id = 'HyrqbPZ5b';
//   cate.increment('number', 1);
//   //cate.setQuery(query);
//   cate.save();
//
//   index++;
//
//   console.log(index);
//
//   res.end();
// }).listen(3000);


// const innerQuery = new CB.InnerQuery(ProductCate);
// innerQuery.equalTo('name', '分类2', '@2');
//
// const query = new CB.Query(Product);
// query.equalTo('name', '测试', '@1');
// query.includeQuery('cate', innerQuery);
//
// query.conditionJoins('@1 || @2');
//
// query.find().then(function (data) {
//   console.log(data.map(item => item.toOrigin()));
// }).catch(function (error) {
//   console.log(error);
// });

// const query = new CB.Query(Product);
// query.equalTo('objectId', 'Sy4t1b4bcZ');
// // query.includeArray('levels', ProductPriceLevel);
// query.include('cate', ProductCate);
// query.include('cate', ProductCate);
// query.count().then(function (data) {
//   console.log(data);
// }).catch(function (error) {
//   console.log(error);
// });

// const query1 = new CB.UnionQuery(Product);
// query1.include('cate', ProductCate);
// query1.equalTo('objectId', 'HyHKkbEZcb');
//
// const query2 = new CB.UnionQuery(Product);
// query2.include('cate', ProductCate);
// query2.equalTo('objectId', 'HyHKkbEZcb');
//
// const query = new CB.UnionQueryAndAll(query1, query2);
//
// query.count().then(function (data) {
//   console.log(data);
// }).catch(function (error) {
//   console.log(error);
// });



// for(let i = 0; i < 1000; i++) {
//   setTimeout(() => {
//     const query = new CB.Query(ProductCate);
//     query.equalTo('objectId', 'HyrqbPZ5b');
//     query.equalTo('number', 0);
//
//     const cate = new ProductCate();
//     cate.id = 'HyrqbPZ5b';
//     cate.increment('number', 10);
//     cate.setQuery(query);
//     cate.save();
//   }, 1000);
// }

// for(let i = 0; i < 1000; i++) {
//   setTimeout(async () => {
//     CB.Cloud.Transaction(async (client) => {
//       const query = new CB.Query(ProductCate);
//       query.equalTo('objectId', 'HyrqbPZ5b');
//       query.equalTo('number', 0);
//
//       const cate = new ProductCate();
//       cate.id = 'HyrqbPZ5b';
//       cate.increment('number', 10);
//       cate.setQuery(query);
//       await cate.save(client);
//     }).catch(error => {
//       console.log(error);
//     });
//   }, 1000);
// }






// (async () => {
//   const cate = new ProductCate({objectId: 'hh', name: '分类a'}, {serverData: true});
//   cate.set('name', '分类a');
//   cate.set('desc', '描述a');
//   await cate.save();
//   throw new Error('error');
//   console.log('OK');
// })().catch(error => {
//   console.log(error);
// });


// const level = new ProductPriceLevel();
// level.id = 'SkxYy-Eb5b';
//
// const level2 = new ProductPriceLevel();
// level2.id = 'B1ZFkWNZq-';
//
// const query = new CB.Query(ProductPriceMap);
// query.containsAllArray('levels', [level, level2]);
// query.find().then(function (data) {
//   console.log(data);
// }).catch(function (error) {
//   console.log(error);
// });

//
// const cate3 = new ProductCate();
// cate3.set('name', '分类3');
// cate3.save();
//
// const cate4 = new ProductCate();
// cate4.set('name', '分类4');
// cate4.save();

//
// const company1 = new Company();
// company1.set('name', '公司一');
// company1.save();
//
// const company2 = new Company();
// company2.set('name', '公司二');
// company2.save();
//
// const company3 = new Company();
// company3.set('name', '公司三');
// company3.save();


// CB.Cloud.Transaction(async (client) => {
//   const cate = new ProductCate();
//   cate.id = 'SJ6BRQW5W';
//
//   const company = new Company();
//   company.id = 'BygpH07Zc-';
//
//   const file = CB.File.withURL('logo', '#');
//
//   const level1 = new ProductPriceLevel();
//   level1.set('name', '等级一价格');
//   level1.set('icon', file);
//   const level2 = new ProductPriceLevel();
//   level2.set('name', '等级二价格');
//
//   const alone1 = new ProductPriceAlone();
//   alone1.set('name', '独立一价格');
//   const alone2 = new ProductPriceAlone();
//   alone2.set('name', '独立二价格');
//
//   const priceMap = new ProductPriceMap();
//   priceMap.set('company', company);
//   priceMap.set('levels', [level1, level2]);
//   priceMap.set('alones', [alone1, alone2]);
//
//   const product = new Product();
//   product.set('name', '测试');
//   product.set('cate', cate);
//   product.set('priceMap', priceMap);
//   await product.save(client);
// }).catch(error => {
//   console.log(error);
// });
