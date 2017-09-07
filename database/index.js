const CB = require('./modules/cb');

require('./modules/init');
require('./modules/error');
require('./modules/cloud');
require('./modules/file')(CB);
require('./modules/relation')(CB);
require('./modules/object')(CB);
require('./modules/user')(CB);
require('./modules/query')(CB);

require('./request/table')(CB);
require('./request/crud')(CB);

require('./middlewares/session')(CB);

module.exports = CB;
