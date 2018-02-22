module.exports.tables = [
  {
    name: 'TableA',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'name', type: 'text'},
      {name: 'number', type: 'smallint', default: 0},
      {name: 'table1', type: 'pointer'},
    ]
  },
  {
    name: 'TableB',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'name', type: 'text'},
      {name: 'number', type: 'smallint', default: 0},
      {name: 'table2', type: 'pointer'},
    ]
  },
  {
    name: 'Table1',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'name', type: 'text'},
      {name: 'number', type: 'smallint', default: 0},
    ]
  },
  {
    name: 'Table2',
    columns: [
      {name: 'objectId', type: 'text', isPrimary: true},
      {name: 'createdAt', type: 'timestamp'},
      {name: 'updatedAt', type: 'timestamp'},
      {name: 'name', type: 'text'},
      {name: 'number', type: 'smallint', default: 0},
    ]
  },
];
