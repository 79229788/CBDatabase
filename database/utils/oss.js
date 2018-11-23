const co = require('co');
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
        co(function* () {
          ok(yield client[method].apply(_.flatten(args)));
        }).catch(error => {
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
