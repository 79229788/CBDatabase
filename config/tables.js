module.exports.tables = [
  //********************[默认]文件表
  //********************
  {
    name: '_File',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'category', type: 'text'},
      {name: 'name', type: 'text'},
      {name: 'url', type: 'text'},
      {name: 'provider', type: 'text'},
      {name: 'mimeType', type: 'text'},
      {name: 'metaData', type: 'object'},
    ]
  },
  {
    name: 'Table1',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'name', type: 'text'},
      {name: 'boolean', type: 'boolean'},
      {name: 'time', type: 'timestamp'},
      {name: 'number', type: 'smallint', default: 0},
      {name: 'array', type: 'text[]'},
      {name: 'table', type: 'pointer'},
      {name: 'file', type: 'file'},
    ]
  },
  {
    name: 'Table2',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'name', type: 'text'},
      {name: 'time', type: 'timestamp'},
      {name: 'boolean', type: 'boolean'},
      {name: 'number', type: 'smallint', default: 0},
      {name: 'array', type: 'text[]'},
      {name: 'table', type: 'pointer'},
    ]
  },
  {
    name: 'Table3',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'name', type: 'text'},
      {name: 'time', type: 'timestamp'},
      {name: 'boolean', type: 'boolean'},
      {name: 'number', type: 'smallint', default: 0},
      {name: 'array', type: 'text[]'},
      {name: 'table', type: 'pointer'},
    ]
  },
];
