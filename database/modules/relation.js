const _ = require('lodash');

module.exports = function (CB) {

  CB.Relation = function (parent, key) {
    if(!_.isString(key)) throw new TypeError('[Relation error] key must be a string');
    this.parent = parent;
    this.key = key;
    this.className = '';
    this.relationId = '';
  };

  CB.Relation.prototype = {
    /**
     * 转化为json
     * @return {string}
     */
    toJSON: function () {
      return JSON.stringify(this.toOrigin());
    },
    /**
     * 转化为原始对象
     * @return {{__type: string, className: *, relationId: *}}
     */
    toOrigin: function () {
      return {
        '__type': 'Relation',
        'className': this.className,
        'relationId': this.relationId,
      };
    },
    /**
     * 转化为引用指针
     * @return {{__type: string, className: *, relationId: *}}
     */
    getPointer: function () {
      return {
        '__type': 'Relation',
        'className': this.className,
        'relationId': this.relationId,
      };
    },
    /**
     * 保存对象
     * @param objects
     */
    save: function (objects) {
      objects = _.isArray(objects) ? objects : [objects];
      for(let model of objects) {
        if(model.className !== this.className) {
          throw new Error(`[Relation error] All the elements of '${this.key}' must be instances of ${this.className}`);
        }
      }
      const relations = this.parent.get('_relations') || [];
      relations.push({
        className: `${this.className}_${this.relationId}`,
        data: objects
      });
      this.parent.set('__relations', relations);
    },
    /**
     * 获取查询实例
     */
    query: function () {
      if(!this.className || !this.relationId) throw new Error('[Relation error] className or relationId not find');
      return new CB.Query(`${this.className}_${this.relationId}`);
    },
  };

};
