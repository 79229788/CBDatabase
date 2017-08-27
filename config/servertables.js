module.exports.tables = [
  {
    name: '_User',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'username', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'password', type: 'text'},
      {name: 'mobilePhoneNumber', type: 'text', isPrimary: true},
      {name: 'mobilePhoneVerified', type: 'boolean', default: false},
      {name: 'email', type: 'text', isPrimary: true},
      {name: 'emailVerified', type: 'boolean', default: false},
      {name: 'number', type: 'text'},
      {name: 'isActive', type: 'boolean', default: false},
      {name: 'isInitPassword', type: 'boolean', default: true},
      {name: 'isAdmin', type: 'boolean', default: false},
      {name: 'isCreator', type: 'boolean', default: false},
      {name: 'isDel', type: 'boolean', default: false},
      {name: 'otherActionAccess', type: 'text[]'},
      {name: 'authData', type: 'jsonb'},
      {name: 'middleRoles', type: 'jsonb'},
      {name: 'defaultCompany', type: 'jsonb'},
      {name: 'defaultWarehouse', type: 'jsonb'},
      {name: 'defaultSettlementAccount', type: 'jsonb'},
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
  {
    name: 'MiddleRole',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'date'},
      {name: 'updatedAt', type: 'date'},
      {name: 'company', type: 'jsonb'},
      {name: 'name', type: 'text'},
      {name: 'desc', type: 'text'},
      {name: 'actionAccess', type: 'text[]'},
      {name: 'isAdmin', type: 'boolean', default: false},
      {name: 'isDefault', type: 'boolean', default: false},
      {name: 'sort', type: 'integer'},
    ]
  },
];