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
  printSql  : true,
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


const query = new CB.Query(Product);
query.include('priceMap', ProductPriceMap);
query.include('priceMap.company', Company);
query.includeArray('priceMap.levels', ProductPriceLevel);
query.includeArray('priceMap.alones', ProductPriceAlone);
query.get('HyHKkbEZcb').then(function (data) {
  //console.log(data.get('priceMap').get('company').toOrigin());
  //console.log(data.get('priceMap').get('levels').map(item => item.toOrigin()));
  //console.log(data.get('priceMap').get('alones').map(item => item.toOrigin()));
}).catch(function (error) {
  console.log(error);
});

// const cate = new ProductCate();
// cate.set('name', '分类一');
// cate.save();
//
// const company = new Company();
// company.set('name', '奥兜科技');
// company.save();


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
