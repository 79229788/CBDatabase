const _ = require('lodash');
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
     * @param item1
     * @param item2
     */
    generateSessionToken: function (item1, item2) {
      const keys = new Keygrip([this.generateSignString(item1, item2 || this.getRandomString(16))]);
      return keys.sign(item1);
    },
  };
  return function (options) {
    const opts = _.extend({
      name: 'sess',
      secret: 'secret',
      maxAge: 0,
    }, options || {});
    CB.session.options = opts;
    if(!opts.secret) {
      throw new Error(`'secret' option is not allowed to be empty.`);
    }
    return function (req, res, next) {
      const keys = new Keygrip([opts.secret]);
      const cookies = new Cookies(req, res, {keys: keys});
      let responseUser = null;
      //保存当前用户状态
      res.saveCurrentUser = function(user) {
        if (!user || !user.getSessionToken()) console.log('saveCurrentUser: User 对象上没有 sessionToken, 无法正确保存用户状态');
        const session = {
          _uid: user.id,
          _sessionToken: user.getSessionToken()
        };
        responseUser = user;
        opts.signed = true;
        opts.overwrite = true;
        opts.httpOnly = true;
        cookies.set(opts.name, CB.session.encode(session), opts);
        req.currentUser = user;
        req.sessionToken = user.getSessionToken();
      };
      //清理当前用户状态
      res.clearCurrentUser = function() {
        responseUser = null;
        cookies.set(opts.name, '', opts);
        delete req.currentUser;
        delete req.sessionToken;
      };
      if(responseUser) return next();
      //每次请求时验证session
      let sessionObject = {};
      const cookieSession = cookies.get(opts.name);
      const cookieSign = cookies.get(opts.name + '.sig');
      if(cookieSession) sessionObject = CB.session.decode(cookieSession);
      const uid = sessionObject._uid;
      const sessionToken = sessionObject._sessionToken;
      if(uid && sessionToken && keys.verify(`${opts.name}=${cookieSession}`, cookieSign)) {
        CB.sessionRedis.getTemporary(uid).then((data) => {
          if(data === sessionToken) {
            const user = new CB.User();
            user.id = uid;
            user._sessionToken = sessionToken;
            req.currentUser = user;
            req.sessionToken = user.getSessionToken();
          }
          next();
        }).catch(() => {
          next();
        });
        CB.sessionRedis.quit();
      }else {
        next();
      }
    }
  }
};


