const _ = require('lodash');
const CB = require('./database');
const config_postgres = require('./config/postgres');
const config_oss = require('./config/oss');
const config_redis = require('./config/redis');
const config_tables = require('./config/tables');

CB.initPG({
  host      : config_postgres.postgres.host,
  port      : config_postgres.postgres.port,
  user      : config_postgres.postgres.user,
  password  : config_postgres.postgres.password,
  database  : 'test',
  tableList : config_tables.tables,
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

const Company = CB.Object.extend('Company');
const Product = CB.Object.extend('Product');
const ProductCate = CB.Object.extend('ProductCate');
const ProductPriceMap = CB.Object.extend('ProductPriceMap');
const ProductPriceLevel = CB.Object.extend('ProductPriceLevel');
const ProductPriceAlone = CB.Object.extend('ProductPriceAlone');



// const query = new CB.Query(Product);
// query.select('priceMap');
// query.equalTo('objectId', 'HyHKkbEZcb');
// //query.include('subCate', ProductCate);
// query.include('priceMap', ProductPriceMap);
// // query.includeArray('priceMap.levels', ProductPriceLevel);
// query.includeArray('priceMap.alones', ProductPriceAlone);
// query.first().then(function (data) {
//   console.log(data.get('priceMap').toOrigin());
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

const query1 = new CB.UnionQuery(Product);
query1.include('cate', ProductCate);
query1.equalTo('objectId', 'HyHKkbEZcb');

const query2 = new CB.UnionQuery(Product);
query2.include('cate', ProductCate);
query2.equalTo('objectId', 'HyHKkbEZcb');

const query = new CB.UnionQueryAndAll(query1, query2);

query.count().then(function (data) {
  console.log(data);
}).catch(function (error) {
  console.log(error);
});

// (async () => {
//   const cate = new ProductCate();
//   cate.set('name', '分类a');
//   await cate.save();
//   cate.set('desc', '描述a');
//   await cate.save();
//   throw new Error('error');
//   console.log('OK');
// })().catch(error => {
//   console.log(error);
// });

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
