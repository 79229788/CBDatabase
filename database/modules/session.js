const _ = require('lodash');
const onHeaders = require('on-headers');
const Cookies = require('cookies');
const Keygrip = require('keygrip');

module.exports = function(CB) {
  CB.session = {
    /**
     * 解码session
     * @param {String} string
     */
    decode: function (string) {
      const body = new Buffer(string, 'base64').toString('utf8');
      return JSON.parse(body);
    },
    /**
     * 编码session
     * @param {Object} body
     */
    encode: function (body) {
      body = JSON.stringify(body);
      return new Buffer(body).toString('base64');
    },
    /**
     * 获取随机字符串
     * @param length  长度
     * @return {string}
     */
    getRandomString: function (length) {
      const str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let s = "";
      for(let i = 0; i < length; i++){
        const rand = Math.floor(Math.random() * str.length);
        s += str.charAt(rand);
      }
      return s;
    },
    /**
     * 生成签名用的字符串
     * @param secret
     * @param url
     * @return {string}
     */
    generateSignString: function (secret, url) {
      const secret_info = {key: 'secret', value: secret};
      const noncestr_info = {key: 'noncestr', value: this.getRandomString(24)};
      const timestamp_info = {key: 'timestamp', value: (new Date()).getTime() + ''};
      const url_info = {key: 'url', value: url || ''};
      const infos = _.sortBy([secret_info, noncestr_info, timestamp_info, url_info], 'key');
      let arr = [];
      _.each(infos, function (obj) {
        arr.push(obj.key + '=' + obj.value);
      });
      return arr.join('&');
    },
    /**
     * 生成一个sessionToken
     * @param userId
     */
    generateSessionToken: function (userId) {
      const keys = new Keygrip([this.generateSignString(userId)]);
      return keys.sign(userId);
    },
  };
  return function (options) {
    const opts = _.extend({
      name: 'sess',
      secret: 'secret',
      httpOnly: true,
      signed: true,
      maxAge: 0,
      overwrite: true,
      fetchUser: false,
    }, options || {});
    CB.session.options = opts;

    if(!opts.secret) {
      throw new Error(`'secret' option is not allowed to be empty.`);
    }
    return function (req, res, next) {
      let responseUser = null;
      const keys = new Keygrip([CB.session.generateSignString(opts.secret, req.url)]);
      const cookies = new Cookies(req, res, {keys: keys});
      //保存当前用户状态
      res.saveCurrentUser = function(user) {
        if (!user || !user.getSessionToken()) console.log('saveCurrentUser: User 对象上没有 sessionToken, 无法正确保存用户状态');
        responseUser = user;
      };
      //清理当前用户状态
      res.clearCurrentUser = function() {
        responseUser = null;
      };
      onHeaders(res, () => {
        if(responseUser) {
          const session = {
            _uid: responseUser.id,
            _sessionToken: responseUser.getSessionToken()
          };
          cookies.set(opts.name, CB.session.encode(session), opts);
        }else {
          cookies.set(opts.name, '', opts);
        }
      });
      //每次请求时验证session
      let session = {};
      const json = cookies.get(opts.name);
      const sign = cookies.get(opts.name + '.sig');
      if(json) session = CB.session.decode(json);
      const uid = session._uid;
      const sessionToken = session._sessionToken;
      if(uid && sessionToken) {
        CB.User.logInByIdAndSessionToken(uid, sessionToken, sign, opts.fetchUser).then(() => {
          req.currentUser = user;
          req.sessionToken = user.getSessionToken();
          //return next();
        });
      }else {
        //return next();
      }
    }
  }
};


