const CB = require('./cb');
const _ = require('lodash');
const PG = require('pg');
const OSS = require('ali-oss');
const Redis = require('redis');
const ossUtils = require('../utils/oss');
const redisUtils = require('../utils/redis');
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
    tableList: [],
  }, config || {});
  CB.pg = new PG.Pool(CB.pgConfig);
  CB.pg.on('error', (error) => {
    console.error('[PG]', error.message);
  });
  checkTable(CB.pgConfig.tableList || []);
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
  CB.oss.uploadBuffer = async function (key, value) {
    return await ossUtils.uploadBuffer(CB.oss, key, value)
  }
};
/**
 * 初始化网站静态资源OSS(CDN源站)
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
  CB.staticOSS.uploadBuffer = async function (key, value) {
    return await ossUtils.uploadBuffer(CB.staticOSS, key, value)
  }
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
  }, config || {});
  const _config = _.clone(CB.sessionRedisConfig);
  delete _config.password;
  CB.sessionRedis = Redis.createClient(_config);
  CB.sessionRedis.on('error', (error) => {
    console.error('[SessionRedis]', error.message);
  });
  //*****设置临时数据（有过期时间的数据）
  CB.sessionRedis.setTemporary = async function (key, value, expires) {
    if(!expires) throw new Error('Cannot setTemporary with an empty expires.');
    expires = new Date(Date.now() + expires);
    expires = expires.getTime();
    return await redisUtils.set(CB.sessionRedis, key, `${expires}@_@${value}`);
  };
  //*****获取临时数据
  CB.sessionRedis.getTemporary = async function (key) {
    const origin = await redisUtils.get(CB.sessionRedis, key);
    if(!origin || origin.indexOf('@_@') < 0) return null;
    const expires = origin.split('@_@')[0];
    const value = origin.split('@_@')[1];
    if((new Date()).getTime() > expires) return null;
    return value;
  }
};

