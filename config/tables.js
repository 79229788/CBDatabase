module.exports.tables = [
  {
    name: 'Company',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'name', type: 'text'},
    ]
  },
  {
    name: 'Product',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'cate', type: 'pointer'},
      {name: 'name', type: 'text'},
      {name: 'priceMap', type: 'pointer'},
    ]
  },
  {
    name: 'ProductCate',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'name', type: 'text'},
    ]
  },
  {
    name: 'ProductPriceMap',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'company', type: 'pointer'},
      {name: 'levels', type: 'pointer[]'},
      {name: 'alones', type: 'pointer[]'},
    ]
  },
  {
    name: 'ProductPriceLevel',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'name', type: 'text'},
    ]
  },
  {
    name: 'ProductPriceAlone',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'name', type: 'text'},
    ]
  },
];