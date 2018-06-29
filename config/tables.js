module.exports.tables = [
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
