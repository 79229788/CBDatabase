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
  accessKeyId     : config_oss.oss.accessKeySecret,
  accessKeySecret : config_oss.oss.accessKeySecret,
  bucket          : 'erp-user-norm',
});

// (async () => {
//   try {
//     const data = await CB.crud.find('Customer', 'find', {
//       conditionCollection: [
//         {
//           name: 'name',
//           key: 'name',
//           value: 'Code',
//           type: 'containsText'
//         }
//       ],
//       conditionJoins: 'name',
//       includeCollection: [
//         {
//           key: 'levels',
//           type: 'array',
//           className: 'CustomerLevel',
//         },
//         {
//           key: 'cate',
//           type: 'pointer',
//           className: 'CustomerCate',
//         },
//         {
//           key: 'cate.company',
//           type: 'pointer',
//           className: 'Company',
//           conditionCollection: [
//             // {
//             //   name: 'name',
//             //   key: 'number',
//             //   value: 1,
//             //   type: 'equal'
//             // }
//           ],
//           orderCollection: [
//             {
//               key: 'number',
//               type: 'desc',
//             },
//           ]
//         },
//         {
//           key: 'cate.company.user',
//           type: 'pointer',
//           className: 'User',
//         },
//       ],
//       orderCollection: [
//         // {
//         //   key: 'objectId',
//         //   type: 'asc',
//         // },
//       ],
//     });
//     console.log(JSON.stringify(data));
//   }catch (error) {
//     console.log(error);
//   }
// })();

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

const Customer = CB.Object.extend('Customer');
const CustomerCate = CB.Object.extend('CustomerCate');
const CustomerLevel = CB.Object.extend('CustomerLevel');
const Company = CB.Object.extend('Company');

// (async () => {
//   const client = await CB.pg.connect();
//   try {
//     await client.query('BEGIN');
//
//     const customer = new Customer();
//     customer.set('name', '客户Code2');
//     customer.set('levels', _.map(new Array(3), (value, index) => {
//       const company = new Company();
//       company.id = 'Bkk_6OBea';
//       const level = new CustomerLevel();
//       level.set('name', '等级Code' + index);
//       level.set('company', company);
//       return level;
//     }));
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



