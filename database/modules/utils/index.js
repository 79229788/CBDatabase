const _ = require('lodash');

const isNullOrUndefined = function isNullOrUndefined(value) {
  return _.isNull(value) || _.isUndefined(value);
};

module.exports = {
  isNullOrUndefined: isNullOrUndefined,
};
