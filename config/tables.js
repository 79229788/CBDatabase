module.exports.tables = [
  {
    name: '_File',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
      {name: 'url', type: 'text'},
      {name: 'provider', type: 'text'},
      {name: 'mimeType', type: 'text'},
      {name: 'metaData', type: 'object'},
    ]
  },
  {
    name: 'Company',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
    ]
  },
  {
    name: 'Product',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'cate', type: 'pointer'},
      {name: 'name', type: 'text'},
      {name: 'priceMap', type: 'pointer'},
    ]
  },
  {
    name: 'ProductCate',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
    ]
  },
  {
    name: 'ProductPriceMap',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'company', type: 'pointer'},
      {name: 'levels', type: 'pointer[]'},
      {name: 'alones', type: 'pointer[]'},
    ]
  },
  {
    name: 'ProductPriceLevel',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
      {name: 'icon', type: 'file'},
    ]
  },
  {
    name: 'ProductPriceAlone',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'character(19)'},
      {name: 'updatedAt', type: 'character(19)'},
      {name: 'name', type: 'text'},
    ]
  },
];