module.exports.tables = [
  {
    name: '_User',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'name', type: 'text'},
      {name: 'mobilePhoneNumber', type: 'text'},
      {name: 'mobilePhoneVerified', type: 'boolean', default: false},
      {name: 'email', type: 'text'},
      {name: 'emailVerified', type: 'boolean', default: false},
      {name: 'number', type: 'text'},
    ]
  },
  {
    name: '_File',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'name', type: 'text'},
      {name: 'url', type: 'text'},
      {name: 'provider', type: 'text'},
      {name: 'mimeType', type: 'text'},
      {name: 'metaData', type: 'json'},
    ]
  },
];