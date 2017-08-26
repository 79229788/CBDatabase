const _ = require('lodash');
const shortId = require('shortid');

module.exports = function (CB) {

  CB.User = CB.Object.extend("_User", {
    _isCurrentUser: false,
    /**
     * 处理服务器数据，过滤敏感字段
     * @param user
     * @private
     */
    _handleServeData: function (user) {
      this._sessionToken = this.get('sessionToken');
      this._authData = this.get('authData');
      delete user.attributes.password;
      delete user.attributes.authData;
      delete user.attributes.sessionToken;
      return user;
    },
    /**
     * 获取sessionToken
     * @return {*}
     */
    getSessionToken: function () {
      return this._sessionToken;
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
      this.set('sessionToken', CB.session.generateSessionToken(username + password));
      const user = await CB.Object.prototype.save.call(this, client);
      return this._handleServeData(user);
    },

    login: async function () {

    },
  });
  /**
   * 通过userId和sessionToken来登陆
   * @param uid
   * @param sessionToken
   * @param sign
   * @param isFetchUser
   * @return {Promise.<void>}
   */
  CB.User.logInByIdAndSessionToken = async function (uid, sessionToken, sign, isFetchUser) {

  };

};