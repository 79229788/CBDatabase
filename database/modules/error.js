const CB = require('./cb');

CB.Error = function (code, message) {
  const error = new Error();
  error.code = code || -1;
  error.message = message || '未知错误';
  //重写错误信息
  switch (code) {
    case '23505':
      if(message.indexOf('mobilePhoneNumber') > 0) {
        error.code = 5010;
        error.message = CB.Error.code[5010];
      }
      if(message.indexOf('email') > 0) {
        error.code = 5011;
        error.message = CB.Error.code[5011];
      }
      break;
  }
  return error;
};

CB.Error.code = {
  5000: '授权已过期',
  5001: '账号或密码错误',
  5002: '手机号或密码错误',
  5003: '邮箱或密码错误',

  5010: '手机号已被其他人注册，请更换！',
  5011: '邮箱已被其他人注册，请更换！',
};



