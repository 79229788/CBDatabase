const CB = require('./cb');
const _ = require('lodash');
const PG = require('pg');
const OSS = require('ali-oss');
const Redis = require('redis');
const utilOss = require('../utils/oss');
const utilRedis = require('../utils/redis');
const checkTable = require('../hooks/checkTable');
/**
 * 初始化默认数据库
 * @param config
 */
CB.initPG = function (config) {
  CB.pg = {};
  CB.pg.config = _.extend({
    host            : '',
    port            : 8888,
    user            : '',
    password        : '',
    database        : 'web',
    printSql        : false,
    printSqlParams  : false,
    tableList       : [],
    checkTable      : false,
    disabled        : false,
    debug           : false,
  }, config || {});
  if(CB.pg.config.disabled) return;
  CB.pg = new PG.Pool(CB.pg.config);
  CB.pg.on('error', (error) => {
    console.error('[PG]', error.message);
  });
  if(CB.pg.config.checkTable) checkTable(CB.pg.config.tableList || []);
};

/**
 * 初始化默认OSS
 * @param config
 */
CB.initOSS = function (config) {
  CB.oss = {};
  CB.oss.config = _.extend({
    endpoint        : '',
    accessKeyId     : '',
    accessKeySecret : '',
    bucket          : '',
    url             : '',
    disabled        : false,
    debug           : false,
  }, config || {});
  if(CB.oss.config.disabled) return;
  CB.oss = new OSS(CB.oss.config);
  //*****通用请求
  CB.oss.request = async function (method, ...args) {
    return await utilOss.request(CB.oss, method, args);
  };
  //*****上传数据
  CB.oss.uploadBuffer = async function (key, value) {
    return await CB.oss.request('put', key, value);
  };
  //*****删除数据
  CB.oss.deleteFile = async function (key) {
    return await CB.oss.request('delete', key);
  };
};

/**
 * 初始化Session Redis
 * @param config
 */
CB.initSessionRedis = function (config) {
  CB.sessionRedis = {};
  CB.sessionRedis.config = _.extend({
    host            : '',
    port            : 6379,
    password        : '',
    disabled        : false,
    debug           : false,
  }, config || {});
  if(CB.sessionRedis.config.disabled) return;
  const _config = _.clone(CB.sessionRedis.config);
  if(!_config.password) delete _config.password;
  CB.sessionRedis = Redis.createClient(_config);
  CB.sessionRedis.on('error', (error) => {
    console.error('[Session Redis]', error.message);
  });
  //*****通用请求
  CB.sessionRedis.request = async function (method, ...args) {
    return await utilRedis.request(CB.sessionRedis, method, args);
  };
  //*****设置临时数据（有过期时间的数据，若缺省则沿用之前剩余时间）
  CB.sessionRedis.setTemporary = async function handle (key, value, expires) {
    if(expires) return await CB.sessionRedis.request('psetex', key, expires, value);
    const pttl = await CB.sessionRedis.request('pttl', key);
    return await handle(key, value, pttl);
  };
  //*****获取临时数据
  CB.sessionRedis.getTemporary = async function (key) {
    return await CB.sessionRedis.request('get', key);
  };
};

