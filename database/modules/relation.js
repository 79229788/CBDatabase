const _ = require('lodash');
const shortId = require('shortid');

module.exports = function (CB) {

  /**
   * Relation
   * @param className   关系父类
   * @param relationId  关系ID
   * @param key         查询Key
   * @constructor
   */
  CB.Relation = function (className, relationId, key) {
    className = _.isString(className) ? className : className.prototype.className;
    this.className = className;
    this.relationId = relationId || shortId.generate();
    this.key = key || '';
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
     * @return {*}
     */
    toOrigin: function () {
      return this.getPointer();
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
        'key': this.key,
      };
    },
    /**
     * 保存对象
     * @param objects
     * @param client
     * @return {Promise.<Array>}
     */
    save: async function (objects, client) {
      objects = _.isArray(objects) ? objects : [objects];
      for(let model of objects) {
        if(model.className !== this.className) {
          throw new Error(`[Relation error] The instance of the saved element does not match the specified [${this.className}]！`);
        }
      }
      const parentClassName = this.className;
      const relationClassName = `${this.className}@_@${this.relationId}`;
      await CB.table.createChildTable('public', parentClassName, relationClassName, [
        {name: 'objectId', type: 'text', isPrimary: true},
        {name: '__key', type: 'text'},
      ], client);
      this.key = shortId.generate();
      const unsavedModels = [];
      for(let model of objects) {
        model._className = relationClassName;
        model.set('__key', this.key);
        await CB.Object._deepSaveAsync(model, client);
        unsavedModels.push(model);
      }
      return unsavedModels;
    },
    /**
     * 获取查询实例
     */
    query: function () {
      if(!this.className || !this.relationId) throw new Error('[Relation error] the className or relationId not find');
      if(!this.key) throw new Error(`[Relation error] the key not find！`);
      const query = new CB.Query(`${this.className}@_@${this.relationId}`);
      query.equalTo('__key', this.key);
      return query;
    },
  };

};
