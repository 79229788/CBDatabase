const CB = require('./cb');
const _ = require('lodash');
const PG = require('pg');
const OSS = require('ali-oss');
const Redis = require('redis');

/**
 * 初始化默认数据库
 * @param config
 */
CB.initPG = function (config) {
  CB.pgConfig = _.extend({
    host     : '',
    port     : 8888,
    user     : '',
    password : '',
    database : 'web',
    printSql : false,
  }, config || {});
  CB.pg = new PG.Pool(CB.pgConfig);
  CB.pg.on('error', (error, client) => {
    console.error('Unexpected error on idle client', error);
    process.exit(-1);
  });
};

/**
 * 初始化默认OSS
 * @param config
 */
CB.initOSS = function (config) {
  CB.ossConfig = _.extend({
    region          : '',
    accessKeyId     : '',
    accessKeySecret : '',
    bucket          : 'web-user-norm',
  }, config || {});

  CB.oss = new OSS(CB.ossConfig);
};
/**
 * 初始化网站静态资源OSS
 * @param config
 */
CB.initStaticOSS = function (config) {
  CB.staticOSSConfig = _.extend({
    region          : '',
    accessKeyId     : '',
    accessKeySecret : '',
    bucket          : 'web-static-resource',
  }, config || {});
  CB.staticOSS = new OSS(CB.staticOSSConfig);
};

/**
 * 初始化Session Redis
 * @param config
 */
CB.initSessionRedis = function (config) {
  CB.sessionRedisConfig = _.extend({
    host: '',
    port: 8888,
    password : '',
  }, config || {});
  CB.sessionRedis = Redis.createClient(sessionRedisConfig);
};

