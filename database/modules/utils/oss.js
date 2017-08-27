module.exports = {
  /**
   * OSSBuffer上传
   * @param client
   * @param key
   * @param value
   * @return {Promise.<void>}
   * @constructor
   */
  uploadBuffer: function (client, key, value) {
    return new Promise((ok, no) => {
      try{
        co(function* () {
          ok(yield client.put(key, value));
        });
      }catch(error) {
        no(error);
      }
    });
  }
};