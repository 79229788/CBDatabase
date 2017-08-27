const CB = require('./modules/cb');

require('./modules/init');
require('./modules/error');
require('./modules/table')(CB);
require('./modules/crud')(CB);
require('./modules/session')(CB);
require('./modules/file')(CB);
require('./modules/relation')(CB);
require('./modules/object')(CB);
require('./modules/user')(CB);
require('./modules/query')(CB);

module.exports = CB;
