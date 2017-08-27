const _ = require('lodash');
const md5 = require('md5');

module.exports = function (CB) {

  CB.User = CB.Object.extend("_User", {
    /**
     * 处理服务器数据，过滤敏感字段
     * @param user
     * @private
     */
    _handleServeData: function (user) {
      this._authData = this.get('authData');
      delete user.attributes.password;
      delete user.attributes.authData;
      return user;
    },
    /**
     * 检查该用户的登录状态是否有效
     * @return {Promise.<void>}
     */
    isAuthenticated: async function () {
      if(!this.id) return false;
      const sessionToken = await CB.sessionRedis.getTemporary(this.id);
      CB.sessionRedis.quit();
      return !!sessionToken;
    },
    /**
     * 获取sessionToken
     * @return {*}
     */
    getSessionToken: function () {
      return this._sessionToken;
    },
    /**
     * 刷新sessionToken(会导致登陆失效)
     */
    refreshSessionToken: function () {
      if(!this.id) throw new Error('Cannot refreshSessionToken with an empty id.');
      const sessionToken = CB.session.generateSessionToken(this.id);
      CB.sessionRedis.setTemporary(this.id, sessionToken, CB.session.options.maxAge);
      CB.sessionRedis.quit();
      this._sessionToken = sessionToken;
    },
    /**
     * 注册用户
     * @param client
     * @return {Promise.<*>}
     */
    signUp: async function (client) {
      const username = this.get('username');
      const password = this.get('password');
      if(!username) throw new Error('Cannot sign up user with an empty username.');
      if(!password) throw new Error('Cannot sign up user with an empty password.');
      this.set('password', md5(password));
      const user = await CB.Object.prototype.save.call(this, client);
      //储存sessionToken
      const sessionToken = CB.session.generateSessionToken(username, password);
      CB.sessionRedis.setTemporary(user.id, sessionToken, CB.session.options.maxAge);
      CB.sessionRedis.quit();
      this._sessionToken = sessionToken;
      return this._handleServeData(user);
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
      const query = new CB.Query(CB.User);
      query.equalTo(accountKey, account);
      query.equalTo('password', md5(password));
      if(queryBlock) queryBlock(query);
      const user = await query.first(client);
      if(!user) throw new CBError(errorCode, CBError.code[errorCode]);
      //刷新sessionToken
      const sessionToken = CB.session.generateSessionToken(account, password);
      CB.sessionRedis.setTemporary(user.id, sessionToken, CB.session.options.maxAge);
      CB.sessionRedis.quit();
      user._sessionToken = sessionToken;
      return this._handleServeData(user);
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
     * 通过sessionToken来登陆
     * @param sessionToken
     * @param queryBlock
     * @param client
     * @return {Promise.<void>}
     */
    loginWithSessionToken: async function (sessionToken, queryBlock, client) {
      if(!this.id) throw new Error('Cannot loginWithSessionToken with an empty id.');
      const oldSessionToken = await CB.sessionRedis.getTemporary(this.id);
      CB.sessionRedis.quit();
      if(!oldSessionToken) throw new CBError(5000, CBError.code[5000]);
      const query = new CB.Query(CB.User);
      if(queryBlock) queryBlock(query);
      const user = await query.get(this.id, client);
      //刷新sessionToken
      const sessionToken = CB.session.generateSessionToken(this.id);
      CB.sessionRedis.setTemporary(user.id, sessionToken, CB.session.options.maxAge);
      CB.sessionRedis.quit();
      user._sessionToken = sessionToken;
      return this._handleServeData(user);
    },
    
  });

};