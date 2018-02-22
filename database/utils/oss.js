const co = require('co');
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
      co(function* () {
        ok(yield client.put(key, value));
      }).catch(error => {
        no(error);
      });
    });
  },
  /**
   * OSS删除文件
   * @param client
   * @param key
   * @return {Promise}
   */
  deleteFile: function (client, key) {
    return new Promise((ok, no) => {
      co(function* () {
        ok(yield client.delete(key));
      }).catch(error => {
        no(error);
      });
    });
  },
};
