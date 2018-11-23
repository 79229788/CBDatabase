const _ = require('lodash');

module.exports = {
  /**
   * 请求方法
   * @param method
   * @param client
   * @param args
   */
  request: function (client, method, ...args) {
    return new Promise((ok, no) => {
      let retry = 0;
      (function handle() {
        client.send_command(method, _.flatten(args), (err, data) => {
          if(!err) return ok(data);
          if(retry < 10) {
            setTimeout(() => {
              handle();
            }, _.random(100, 2000));
          }else {
            no(err);
          }
          retry ++;
        });
      })();
    });
  }
};
