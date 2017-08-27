module.exports = {
  /**
   * 设置数据
   * @param client
   * @param key
   * @param value
   * @return {Promise}
   */
  set: function (client, key, value) {
    return new Promise((ok, no) => {
      client.set(key, value, function (error, data) {
        if(error) no(error);
        ok(data);
      });
    });
  },
  /**
   * 获取数据
   * @param client
   * @param key
   * @return {Promise}
   */
  get: function (client, key) {
    return new Promise((ok, no) => {
      client.get(key, function (error, data) {
        if(error) no(error);
        ok(data);
      });
    });
  }
};