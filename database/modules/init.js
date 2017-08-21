const CB = require('./cb');
const _ = require('lodash');
const co = require('co');
const PG = require('pg');
const OSS = require('ali-oss');

/**
 * 初始化数据库
 * @param config
 */
CB.init = function (config) {
  CB.config = _.extend({
    host     : '',
    port     : 0,
    user     : '',
    password : '',
    database : '',
    printSql : false,
  }, config || {});
  CB.pool = new PG.Pool(CB.config);
  CB.pool.on('error', (error, client) => {
    console.error('Unexpected error on idle client', error);
    process.exit(-1);
  });
};

/**
 * 初始化对象存储
 * @param config
 */
CB.initOSS = function (config) {
  CB.ossConfig = _.extend({
    region          : '',
    accessKeyId     : '',
    accessKeySecret : '',
    bucket          : '',
  }, config || {});
  CB.client = new OSS(CB.ossConfig);
};


