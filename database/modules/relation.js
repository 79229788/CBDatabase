const _ = require('lodash');
const uniqid = require('uniqid');

module.exports = function (CB) {

  /**
   * Relation
   * @param className   关系父类
   * @param relationId  关系ID
   * @param key         查询Key
   * @constructor
   */
  CB.Relation = function (className, relationId, key) {
    if(_.isObject(className) && !relationId && !key) {
      this.className = className.className;
      this.relationId = className.relationId;
      this.key = className.key;
    }else {
      className = _.isString(className) ? className : className.prototype.className;
      this.className = className;
      this.relationId = relationId || uniqid();
      this.key = key || '';
    }
  };

  CB.Relation.prototype = {

    _disabledChildTable: false,
    /**
     * 关闭子表关联（关闭后，请务必保证要保存的主表中有__key字段）
     */
    disabledChildTable: function () {
      this._disabledChildTable = true;
      return this;
    },
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
      let relationClassName = `${this.className}@_@${this.relationId}`;
      if(!this.key) {
        if(!this._disabledChildTable) {
          await CB.table.createChildTable('public', parentClassName, relationClassName, [
            {name: 'objectId', type: 'text', isPrimary: true},
            {name: '__key', type: 'text'},
          ], client);
          this.key = uniqid();
        }else {
          relationClassName = this.className;
          this.key = this.relationId;
        }
      }
      const savedModels = [];
      for(let model of objects) {
        model._className = relationClassName;
        model.set('__key', this.key);
        await model._deepSaveAsync(client);
        savedModels.push(model);
      }
      return savedModels;
    },
    /**
     * 获取查询实例
     */
    query: function () {
      if(!this.className || !this.relationId) throw new Error('[Relation error] the className or relationId not find');
      if(!this.key) throw new Error(`[Relation error] the key not find！`);
      const className = this._disabledChildTable ? this.className : `${this.className}@_@${this.relationId}`;
      const query = new CB.Query(className);
      query.equalTo('__key', this.key);
      return query;
    },
    /**
     * 获取用户表的查询实例
     */
    userQuery: function () {
      if(!this.className || !this.relationId) throw new Error('[Relation error] the className or relationId not find');
      if(!this.key) throw new Error(`[Relation error] the key not find！`);
      const className = this._disabledChildTable ? this.className : `${this.className}@_@${this.relationId}`;
      const query = new CB.UserQuery(className);
      query.equalTo('__key', this.key);
      return query;
    },
  };

};
