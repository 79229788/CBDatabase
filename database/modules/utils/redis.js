module.exports = {
  /**
   * redis获取数据
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