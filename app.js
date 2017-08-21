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
const CustomerCate = CB.Object.extend('CustomerCate');
const Company = CB.Object.extend('Company');

const customer = new Customer();
customer.set('name', '客户Code');
customer.increment('number', 1);

const cate = new CustomerCate();
cate.set('name', '分类Code');
const company = new Company();
company.set('name', '公司Code');
cate.set('company', company);
customer.set('cate', cate);

//console.log(customer);

//CB.Object.saveAll([customer]);

customer.save().then(function (data) {
  //console.log(data);
}, function (error) {
  console.log(error);
});





