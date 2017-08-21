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
//           key: 'cate',
//           type: 'exist'
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
//             {
//               name: 'name',
//               key: 'number',
//               value: 1,
//               type: 'equal'
//             }
//           ],
//           conditionJoins: 'name',
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
const User = CB.Object.extend('_User');
const user = new User();
user.set('name', 'duyang');
user.set('sex', 1);
user.increment('number', 1);

console.log(user);
// user.save().then(function (data) {
//   console.log(data);
// }, function (error) {
//   console.log(error);
// });





