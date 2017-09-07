const CB = require('./cb');

CB.Error = function (code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
};

CB.Error.code = {
  5000: '授权已过期',
  5001: '账号或密码错误',
  5002: '手机号或密码错误',
  5003: '邮箱或密码错误',
};

