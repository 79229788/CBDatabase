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
  CB.PG = PG;
  const _config = Object.assign({
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
    env             : 'dev',
  }, config);
  if(config.disabled) return;
  CB.pg = new PG.Pool(_config);
  CB.pg.config = _config;
  CB.pg.on('error', (error) => {
    console.error('[PG]', error.message);
  });
  if(CB.pg.config.checkTable) checkTable(CB.pg.config.tableList || []);
};

/**
 * 初始化CDN仓库
 * @param config
 */
CB.initCdnOSS = function (config) {
  CB.OSS = OSS;
  CB.ossUtils = utilOss;
  const _config = Object.assign({
    endpoint        : '',
    endpointInternal: '',
    accessKeyId     : '',
    accessKeySecret : '',
    bucket          : '',
    domain          : '',
    disabled        : false,
    debug           : false,
    env             : 'dev',
  }, config);
  if(config.disabled) return;
  delete _config.endpointInternal;
  _config.endpoint = config.env === 'dev' ? config.endpoint : config.endpointInternal;
  CB.cdnOss = new OSS(_config);
  CB.cdnOss.config = _config;
  //*****上传数据
  CB.cdnOss.uploadBuffer = async function (key, value) {
    return await utilOss.request(CB.cdnOss, 'put', key, value);
  };
  //*****删除数据
  CB.cdnOss.deleteFile = async function (key) {
    return await utilOss.request(CB.cdnOss, 'delete', key);
  };
};

/**
 * 初始化Session仓库
 * @param config
 */
CB.initSessionRedis = function (config) {
  CB.Redis = Redis;
  const _config = Object.assign({
    host            : '',
    port            : 6379,
    password        : '',
    disabled        : false,
    debug           : false,
    env             : 'dev',
  }, config);
  if(config.disabled) return;
  if(!_config.password) delete _config.password;
  CB.sessionRedis = Redis.createClient(_config);
  CB.sessionRedis.config = _config;
  CB.sessionRedis.utils = utilRedis;
  CB.sessionRedis.on('error', (error) => {
    console.error('[Session Redis]', error.message);
  });
  //*****设置临时数据（有过期时间的数据，若缺省则沿用之前剩余时间）
  CB.sessionRedis.setTemporary = async function handle (key, value, expires) {
    if(expires && expires >= 0) return await utilRedis.request(CB.sessionRedis, 'psetex', key, expires, value);
    const pttl = await utilRedis.request(CB.sessionRedis, 'pttl', key);
    return await handle(key, value, pttl);
  };
  //*****获取临时数据
  CB.sessionRedis.getTemporary = async function (key) {
    return await utilRedis.request(CB.sessionRedis, 'get', key);
  };
};

