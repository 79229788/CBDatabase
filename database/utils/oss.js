const _ = require('lodash');

module.exports = {
  /**
   * 请求操作
   * @param client
   * @param method
   * @param args
   * @return {Promise<>}
   */
  request: function(client, method, ...args) {
    return new Promise((ok, no) => {
      let retry = 0;
      (function handle() {
        client[method].apply(client, _.flatten(args)).then(data => {
          ok(data);
        }).catch(error => {
          if(error.code === 'NoSuchKey') return ok(null);
          if(retry < 10) {
            setTimeout(() => {
              handle();
            }, _.random(100, 2000));
          }else {
            no(error);
          }
          retry ++;
        });
      })();
    });
  },
};
