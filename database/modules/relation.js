const _ = require('lodash');

module.exports = function (CB) {

  CB.Relation = function () {

  };

  CB.Relation.prototype = {
    /**
     * 保存对象
     * @param objects
     */
    save: function (objects) {
      objects = _.isArray(objects) ? objects : [objects];

    },
    /**
     * 获取查询实例
     */
    query: function () {

    },
  };

};
