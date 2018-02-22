const CB = require('./cb');
const _ = require('lodash');
const PG = require('pg');
const OSS = require('ali-oss');
const Redis = require('redis');
const ossUtils = require('../utils/oss');
const checkTable = require('../hooks/checkTable');
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
    printSqlParams : false,
    tableList: [],
    checkTable: false,
    disabled: false,
  }, config || {});
  if(CB.pgConfig.disabled) return;
  CB.pg = new PG.Pool(CB.pgConfig);
  CB.pg.on('error', (error) => {
    console.error('[PG]', error.message);
  });
  if(CB.pgConfig.checkTable) checkTable(CB.pgConfig.tableList || []);
};

/**
 * 初始化默认OSS
 * @param config
 */
CB.initOSS = function (config) {
  CB.ossConfig = _.extend({
    endpoint        : '',
    accessKeyId     : '',
    accessKeySecret : '',
    bucket          : '',
    url             : '',
    disabled: false,
  }, config || {});
  if(CB.ossConfig.disabled) return;
  CB.oss = new OSS(CB.ossConfig);
  CB.oss.uploadBuffer = async function (key, value) {
    return await ossUtils.uploadBuffer(CB.oss, key, value);
  };
  CB.oss.deleteFile = async function (key) {
    return await ossUtils.deleteFile(CB.oss, key);
  };
};

/**
 * 初始化Session Redis
 * @param config
 */
CB.initSessionRedis = function (config) {
  CB.sessionRedisConfig = _.extend({
    host: '',
    port: 6379,
    password : '',
    disabled: false,
  }, config || {});
  if(CB.sessionRedisConfig.disabled) return;
  const _config = _.clone(CB.sessionRedisConfig);
  if(!_config.password) delete _config.password;
  CB.sessionRedis = Redis.createClient(_config);
  //*****设置临时数据（有过期时间的数据）
  CB.sessionRedis.setTemporary = async function (key, value, expires) {
    if(!expires) throw new Error('sessionRedis中setTemporary方法的expires参数不能为空');
    return new Promise((ok, no) => {
      CB.sessionRedis.psetex(key, expires, value, function (error, data) {
        if(error) no(error);
        ok(data);
      });
    });
  };
  //*****获取临时数据
  CB.sessionRedis.getTemporary = async function (key) {
    return new Promise((ok, no) => {
      CB.sessionRedis.get(key, function (error, data) {
        if(error) no(error);
        ok(data);
      });
    });
  }
};

