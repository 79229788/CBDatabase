const _ = require('lodash');
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
      fetchUser: false,
      exclude: ['.js', '.css', '.ttf', '.png', '.jpg', '.jpeg', '.gif', '.ico'],
    }, options || {});
    CB.session.options = opts;
    if(!opts.secret) {
      throw new Error(`'secret' option is not allowed to be empty.`);
    }
    return function (req, res, next) {
      let isDisabled = false;
      for(let name of opts.exclude) {
        if(req.url.indexOf(name) > 0) { //过滤不用验证的请求
          isDisabled = true;
          break;
        }
      }
      if(isDisabled) return next();
      let responseUser = null;
      //保存当前用户
      res.saveCurrentUser = async function(user) {
        if(!user || !user.getSessionToken()) throw new Error('saveCurrentUser: User 对象上没有 sessionToken, 无法正确保存用户状态');
        const session = {
          _uid: user.id,
          _sessionToken: user.getSessionToken()
        };
        responseUser = user;
        req.currentUser = user;
        req.sessionToken = user.getSessionToken();
        await user.saveCurrentUserInCache(opts.maxAge);
        user.set('_session', CB.session.encode(session));
        return user;
      };
      //清理当前用户状态
      res.clearCurrentUser = async function() {
        responseUser = null;
        delete req.currentUser;
        delete req.sessionToken;
      };
      if(responseUser) return next();
      //每次请求时验证session
      (async () => {
        const sessionData = CB.session.decode(req.headers.sess) || {};
        const uid = sessionData._uid;
        const sessionToken = sessionData._sessionToken;
        if(uid && sessionToken) {
          const userPointer = new CB.User();
          userPointer.id = uid;
          userPointer._sessionToken = sessionToken;
          if(await userPointer.isAuthenticated()) {
            if(opts.fetchUser) {
              const user = await userPointer.getCurrentUserFromCache();
              user._sessionToken = sessionToken;
              req.currentUser = user;
              req.sessionToken = sessionToken;
            }else {
              req.currentUser = userPointer;
              req.sessionToken = sessionToken;
            }
          }
        }
        return next();
      })().catch(() => {
        return next();
      });
    }
  }
};


