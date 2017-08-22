const _ = require('lodash');
const CB = require('./database');
const config_postgres = require('./config/postgres');
const config_oss = require('./config/oss');

CB.initPG({
  host     : config_postgres.postgres.host,
  port     : config_postgres.postgres.port,
  user     : config_postgres.postgres.user,
  password : config_postgres.postgres.password,
  database : 'ERP',
  printSql : true,
});
CB.initOSS({
  region          : config_oss.oss.region,
  accessKeyId     : config_oss.oss.accessKeyId,
  accessKeySecret : config_oss.oss.accessKeySecret,
  bucket          : 'erp-user-norm',
});


const Customer = CB.Object.extend('Customer');
const CustomerCate = CB.Object.extend('CustomerCate');
const CustomerLevel = CB.Object.extend('CustomerLevel');
const Company = CB.Object.extend('Company');

const innerInnerQuery = new CB.InnerQuery('Company');
//innerInnerQuery.equalTo('name', '公司1');

const innerQuery = new CB.InnerQuery('CustomerCate');
innerQuery.equalTo('name', '供货商');
innerQuery.ascending('number');

const query = new CB.Query('Customer');
query.matchesQuery('cate', innerQuery);
//query.matchesQuery('cate.company', innerInnerQuery);
query.count().then(function (data) {
  console.log(JSON.stringify(data));
}).catch(function (error) {
  console.log(error);
});



// (async () => {
//   try {
//     await CB.crud.save('CustomerCate', {
//       objectId: 'ryoknbP_Z',
//       number: 1
//     });
//     console.log('save success');
//   }catch (error) {
//     console.log(error);
//   }
// })();






// const bytes = [0xBE, 0xEF, 0xCA, 0xFE];
// const byteArrayFile = new CB.File('myfile.txt', bytes);
// byteArrayFile.save().then((file) => {
//   console.log(file);
// }).catch((error) => {
//   console.log(error);
// });


// (async () => {
//   const client = await CB.pg.connect();
//   try {
//     await client.query('BEGIN');
//
//     const customer = new Customer();
//     customer.set('name', '客户Code2');
//     customer.set('levels', _.map(new Array(2), (value, index) => {
//       const company = new Company();
//       company.id = 'Bkk_6OBea';
//       const level = new CustomerLevel();
//       level.set('name', '等级Code' + index);
//       level.set('company', company);
//       return level;
//     }));
//     const data = { base64: '6K+077yM5L2g5Li65LuA5LmI6KaB56C06Kej5oiR77yf' };
//     const file = new CB.File('avatar', data);
//     await file.save(client);
//     customer.set('avatar', file);
//
//     const res = await customer.save(client);
//     console.log(res);
//
//     await client.query('COMMIT');
//   }catch (error) {
//     await client.query('ROLLBACK');
//     console.log(error);
//   }finally {
//     client.release();
//   }
// })().catch(e => console.log(e.message));



