const _ = require('lodash');
const CB = require('./database');
const config_postgres = require('./config/postgres');
const config_oss = require('./config/oss');
const config_redis = require('./config/redis');

CB.initPG({
  host     : config_postgres.postgres.host,
  port     : config_postgres.postgres.port,
  user     : config_postgres.postgres.user,
  password : config_postgres.postgres.password,
  database : 'erp',
  printSql : true,
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

const Employee = CB.Object.extend('Employee');
const Company = CB.Object.extend('Company');

const query = new CB.UserQuery(Employee);
query.include('defaultCompany', Company);
query.get('B1lG6qnsK-').then(function (data) {
  console.log(data.toOrigin());
}).catch(function (error) {
  console.log(error);
});




// const query = new CB.Query('Customer');
// query.includeArray('levels', CustomerLevel);
// query.include('cate', CustomerCate);
// query.include('cate.company', Company);
// query.include('avatar', '_File');
// query.find().then(function (data) {
//   console.log(data[0].get('cate'));
// }).catch(function (error) {
//   console.log(error);
// });



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
//     const role1 = new MiddleRole();
//     role1.set('name', 'roleA');
//     const role2 = new MiddleRole();
//     role2.set('name', 'roleB');
//     const customer = new Customer();
//     customer.id = 'BJeGG6hadZ';
//     customer.set('name', 'duyang');
//     // const relation = customer.setRelation('roles', MiddleRole);
//     // relation.save([role1, role2]);
//     //const relationQuery = relation.query();
//     //const res = await relationQuery.find();
//     //console.log(customer.get('cate').id);
//
//     //console.log(customer.toOrigin());
//     const res = await customer.save(client);
//     console.log(res);
//
//
//     await client.query('COMMIT');
//   }catch (error) {
//     await client.query('ROLLBACK');
//     console.log(error);
//   }finally {
//     client.release();
//   }
// })().catch(e => console.log(e.message));


// (async () => {
//   const client = await CB.pg.connect();
//   try {
//     await client.query('BEGIN');
//
//     const customer = new Customer();
//     customer.set('name', '客户Code2');
//     customer.set('levels', _.map(new Array(2), (value, index) => {
//       const company = new Company();
//       //company.id = 'Bkk_6OBea';
//       const level = new CustomerLevel();
//       level.set('name', '等级Code' + index);
//       level.set('company', company);
//       return level;
//     }));
//     // const data = { base64: '6K+077yM5L2g5Li65LuA5LmI6KaB56C06Kej5oiR77yf' };
//     // const file = new CB.File('avatar', data);
//     // await file.save(client);
//     // customer.set('avatar', file);
//
//     const res = await customer.save(client);
//     //console.log(res);
//
//
//     await client.query('COMMIT');
//   }catch (error) {
//     await client.query('ROLLBACK');
//     console.log(error);
//   }finally {
//     client.release();
//   }
// })().catch(e => console.log(e.message));

