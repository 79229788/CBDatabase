module.exports = function (base64) {
  // 兼容 dataURL
  if(base64.split(',')[0] && base64.split(',')[0].indexOf('base64') >= 0) {
    base64 = base64.split(',')[1];
  }
  return new Buffer(base64, 'base64');
};