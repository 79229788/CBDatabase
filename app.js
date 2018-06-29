const _ = require('lodash');
const CB = require('./database');
const config_postgres = require('./config/postgres');
const config_oss = require('./config/oss');
const config_redis = require('./config/redis');
const config_tables = require('./config/tables');
const http = require('http');

CB.initPG({
  host            : config_postgres.postgres.host,
  port            : config_postgres.postgres.port,
  user            : config_postgres.postgres.user,
  password        : config_postgres.postgres.password,
  database        : 'test',
  tableList       : config_tables.tables,
  checkTable      : true,
  printSql        : true,
  printSqlParams  : true
});
CB.initOSS({
  endpoint        : config_oss.oss.endpoint,
  accessKeyId     : config_oss.oss.accessKeyId,
  accessKeySecret : config_oss.oss.accessKeySecret,
  bucket          : config_oss.oss.bucket,
});
CB.initSessionRedis({
  host          : config_redis.redis.sessionRedis.host,
  port          : config_redis.redis.sessionRedis.port,
  password      : config_redis.redis.sessionRedis.password,
});


