const _ = require('lodash');
const md5 = require('md5');

module.exports = function (CB) {

  CB.User = CB.Object.extend("_User", {
    _disabledRefreshSessionToken: false,
    _forceLogin: false,
    /**
     * 设置子类名称
     * @param name
     */
    setChildClass: function (name) {
      if(!name) return;
      this._className = _.isString(name) ? name : name.prototype.className;
    },
    /**
     * 登陆时禁止刷新SessionToken[账号登陆时]
     */
    disabledRefreshSessionToken: function (value = false) {
      this._disabledRefreshSessionToken = value;
    },
    /**
     * 可强制登录
     * @param value
     */
    forceLogin: function (value = false) {
      this._forceLogin = value;
    },
    /**
     * 设置会员名
     * @param value
     */
    setUsername: function (value) {
      return this.set('username', value);
    },
    /**
     * 设置密码
     * @param value
     */
    setPassword: function (value) {
      return this.set('password', md5(value));
    },
    /**
     * 设置邮箱
     * @param value
     */
    setEmail: function (value) {
      return this.set('email', value);
    },
    /**
     * 设置手机号
     * @param value
     */
    setMobilePhoneNumber: function (value) {
      return this.set('mobilePhoneNumber', value);
    },
    /**
     * 是否已验证了手机
     * @param bool
     */
    isVerifiedMobilePhone: function (bool) {
      return this.set('mobilePhoneVerified', bool);
    },
    /**
     * 是否已验证了邮箱
     * @param bool
     */
    isVerifiedEmail: function (bool) {
      return this.set('emailVerified', bool);
    },
    /**
     * 检查该用户的登录状态是否有效
     * @param sessionToken 当前要验证的对象的sessionToken（缺省则为自动获取对象中的sessionToken）
     * @return {Promise.<void>}
     */
    isAuthenticated: async function (sessionToken) {
      if(!this.id) return false;
      if(!sessionToken && !this.getSessionToken()) throw new Error('isAuthenticated: 当前User对象上没有sessionToken, 无法进行验证！');
      const _sessionToken = await this.getSessionTokenFromCache();
      return _sessionToken === (sessionToken || this.getSessionToken());
    },
    /**
     * 获取当前对象中的sessionToken
     * @return {*}
     */
    getSessionToken: function () {
      return this._sessionToken;
    },
    /**
     * 从缓存中获取SessionToken
     * @return {Promise<*>}
     */
    getSessionTokenFromCache: async function () {
      return await CB.sessionRedis.getTemporary(this.id);
    },
    /**
     * 刷新sessionToken(会导致登陆失效)
     */
    refreshSessionToken: async function () {
      if(!this.id) throw new Error('Cannot refreshSessionToken with an empty id.');
      const sessionToken = CB.session.generateSessionToken(this.id);
      const data = await CB.sessionRedis.setTemporary(this.id, sessionToken, CB.session.options.maxAge);
      this._sessionToken = sessionToken;
      return data;
    },
    /**
     * 设置sessionToken[仅仅过期时才设置]
     * @param key1
     * @param key2
     * @return {Promise.<void>}
     */
    setSessionToken: async function (key1, key2) {
      //直接使用未过期的sessionToken
      let sessionToken = await CB.sessionRedis.getTemporary(this.id);
      if(!sessionToken) {
        sessionToken = CB.session.generateSessionToken(key1, key2);
        await CB.sessionRedis.setTemporary(this.id, sessionToken, CB.session.options.maxAge);
      }
      this._sessionToken = sessionToken;
    },
    /**
     * 设置新的sessionToken
     * @param key1
     * @param key2
     * @return {Promise.<void>}
     */
    setNewSessionToken: async function (key1, key2) {
      const sessionToken = CB.session.generateSessionToken(key1, key2);
      await CB.sessionRedis.setTemporary(this.id, sessionToken, CB.session.options.maxAge);
      this._sessionToken = sessionToken;
    },
    /**
     * 保存当前用户到缓存服务器（用于高速访问）
     * @return {Promise.<void>}
     */
    saveCurrentUserInCache: async function (maxAge) {
      await CB.sessionRedis.setTemporary(this.id + '@info', this.toJSON(), _.isUndefined(maxAge) ? CB.session.options.maxAge : maxAge);
      return this;
    },
    /**
     * 从缓存服务器获取当前用户
     * @param childClass
     * @return {Promise.<*>}
     */
    getCurrentUserFromCache: async function (childClass) {
      const data = JSON.parse(await CB.sessionRedis.getTemporary(this.id + '@info'));
      const user = new CB.User(data);
      user.setChildClass(childClass || data.className || this._className);
      return user;
    },
    /**
     * 从缓存服务器移除当前用户
     * @return
     */
    removeCurrentUserFromCache: function () {
      CB.sessionRedis.del(this.id + '@info');
      return this;
    },
    /**
     * 绑定微信授权信息
     * @param unionId
     * @param sessionToken
     */
    bindWechatAuth: function (unionId, sessionToken) {
      this._bindPlatformAuthBase('wechat', unionId, sessionToken)
    },
    /**
     * 绑定第三方平台
     * @param type
     * @param unionId
     * @param sessionToken
     * @return {Promise.<void>}
     * @private
     */
    _bindPlatformAuthBase: async function (type, unionId, sessionToken) {
      if(!sessionToken) sessionToken = CB.session.generateSessionToken(type, unionId);
      this.set('authData', {
        [type]: {
          unionId: unionId,
          sessionToken: sessionToken,
          expires: new Date().getTime() + CB.session.options.maxAge,
        }
      });
    },
    /**
     * 注册用户
     * @param accountKey
     * @param client
     * @return {Promise.<*>}
     */
    _signUpBase: async function (accountKey, client) {
      const account = this.get(accountKey);
      const password = this.get('password');
      if(!account) throw new Error(`Cannot sign up user with an empty ${accountKey}.`);
      if(!password) throw new Error('Cannot sign up user with an empty password.');
      const user = await CB.Object.prototype.save.call(this, client);
      //储存sessionToken
      const sessionToken = CB.session.generateSessionToken(account, password);
      CB.sessionRedis.setTemporary(user.id, sessionToken, CB.session.options.maxAge);
      this._sessionToken = sessionToken;
      return user;
    },
    /**
     * 注册账号
     * @param client
     * @return {Promise.<*|Promise.<void>>}
     */
    signUp: async function (client) {
      return await this._signUpBase('username', client);
    },
    /**
     * 通过手机号注册账号
     * @param client
     * @return {Promise.<*|Promise.<void>>}
     */
    signUpWithMobilePhoneNumber: async function (client) {
      return await this._signUpBase('mobilePhoneNumber', client);
    },
    /**
     * 通过邮箱注册账号
     * @param client
     * @return {Promise.<*|Promise.<void>>}
     */
    signUpWithEmail: async function (client) {
      return await this._signUpBase('email', client);
    },
    /**
     * 登陆
     * @param accountKey
     * @param errorCode
     * @param queryBlock
     * @param client
     * @return {Promise.<void>}
     * @private
     */
    _loginBase: async function(accountKey, errorCode, queryBlock, client) {
      const account = this.get(accountKey);
      const password = this.get('password');
      if(!account) throw new Error(`Cannot login with an empty ${accountKey}.`);
      if(!password) throw new Error('Cannot login with an empty password.');
      const query = new CB.UserQuery(this.className);
      query.equalTo(accountKey, account);
      if(!this._forceLogin) query.equalTo('password', md5(password));
      if(queryBlock) queryBlock(query);
      const users = await query.find(client);
      if(users.length === 0) throw CB.Error(errorCode, CB.Error.code[errorCode]);
      if(this._disabledRefreshSessionToken) {
        await users[0].setSessionToken(account, password);
      }else {
        await users[0].setNewSessionToken(account, password);
      }
      if(users.length === 1) return users[0];
      return users;
    },
    /**
     * 使用会员名和密码登陆
     * @param queryBlock
     * @param client
     * @return {Promise.<void>}
     */
    login: async function (queryBlock, client) {
      return await this._loginBase('username', 5001, queryBlock, client);
    },
    /**
     * 使用手机号和密码登陆
     * @param queryBlock
     * @param client
     * @return {Promise.<*|Promise.<void>>}
     */
    logInWithMobilePhone: async function (queryBlock, client) {
      return await this._loginBase('mobilePhoneNumber', 5002, queryBlock, client);
    },
    /**
     * 使用邮箱和密码登陆
     * @param queryBlock
     * @param client
     * @return {Promise.<*|Promise.<void>>}
     */
    logInWithEmail: async function (queryBlock, client) {
      return await this._loginBase('email', 5003, queryBlock, client);
    },
    /**
     * 通过微信UnionId登陆
     * @param unionId
     * @param queryBlock
     * @param client
     * @return {Promise.<void>}
     */
    loginWithWechatUnionId: async function (unionId, queryBlock, client) {
      return await this._loginWithPlatformUnionId('wechat', unionId, queryBlock, client)
    },
    /**
     * 通过平台UnionId登陆
     * @param type
     * @param unionId
     * @param queryBlock
     * @param client
     * @return {Promise.<*>}
     */
    _loginWithPlatformUnionId: async function (type, unionId, queryBlock, client) {
      const query = new CB.UserQuery(this.className);
      query.equalInJson('authData', `${type}.unionId`, unionId);
      if(queryBlock) queryBlock(query);
      const users = await query.find(client);
      if(users.length === 0) return null;
      await users[0].setSessionToken(type, unionId);
      if(users.length === 1) return users[0];
      return users;
    },
    /**
     * 退出登陆
     */
    logOut: function () {
      if(!this.id) throw new Error('Cannot logOut with an empty id.');
      CB.sessionRedis.del(this.id);
      this.removeCurrentUserFromCache();
      return this;
    },

  });
  /**
   * 使用会员名和密码登陆
   * @param username
   * @param password
   * @param childClass
   * @param queryBlock
   * @param options
   * @param client
   * @return {Promise.<void>}
   */
  CB.User.login = async function (username, password, childClass, queryBlock, options, client) {
    const opts = _.extend({
      disabledRefreshSessionToken: false,
      forceLogin: false,
    }, options);
    const user = new CB.User();
    user.setChildClass(childClass);
    user.disabledRefreshSessionToken(opts.disabledRefreshSessionToken);
    user.forceLogin(opts.forceLogin);
    user.set('username', username);
    user.set('password', password);
    return await user.login(queryBlock, client);
  };
  /**
   * 使用手机号和密码登陆
   * @param mobilePhoneNumber
   * @param password
   * @param childClass
   * @param queryBlock
   * @param options
   * @param client
   * @return {Promise.<*|Promise.<void>>}
   */
  CB.User.logInWithMobilePhone = async function (mobilePhoneNumber, password, childClass, queryBlock, options, client) {
    const opts = _.extend({
      disabledRefreshSessionToken: false,
      forceLogin: false,
    }, options);
    const user = new CB.User();
    user.setChildClass(childClass);
    user.disabledRefreshSessionToken(opts.disabledRefreshSessionToken);
    user.forceLogin(opts.forceLogin);
    user.set('mobilePhoneNumber', mobilePhoneNumber);
    user.set('password', password);
    return await user.logInWithMobilePhone(queryBlock, client);
  };
  /**
   * 使用邮箱和密码登陆
   * @param email
   * @param password
   * @param childClass
   * @param queryBlock
   * @param options
   * @param client
   * @return {Promise.<*|Promise.<void>>}
   */
  CB.User.logInWithEmail = async function (email, password, childClass, queryBlock, options, client) {
    const opts = _.extend({
      disabledRefreshSessionToken: false,
      forceLogin: false,
    }, options);
    const user = new CB.User();
    user.setChildClass(childClass);
    user.disabledRefreshSessionToken(opts.disabledRefreshSessionToken);
    user.forceLogin(opts.forceLogin);
    user.set('email', email);
    user.set('password', password);
    return await user.logInWithEmail(queryBlock, client);
  };
  /**
   * 使用微信UnionId登陆
   * @param unionId
   * @param childClass
   * @param queryBlock
   * @param client
   * @return {Promise.<*|Promise.<*|Promise.<void>>>}
   */
  CB.User.loginWithWechatUnionId = async function (unionId, childClass, queryBlock, client) {
    const user = new CB.User();
    user.setChildClass(childClass);
    return await user.loginWithWechatUnionId(unionId, queryBlock, client);
  };
  /**
   * 退出登陆
   * @param userId
   */
  CB.User.logOut = async function (userId) {
    const user = new CB.User();
    user.id = userId;
    return user.logOut();
  };

};
