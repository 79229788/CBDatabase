const _ = require('lodash');

module.exports = function (CB) {
  /**
   * 通用查询
   * @param objectClass
   * @param relationId
   * @constructor
   */
  CB.Query = function (objectClass, relationId) {
    if(objectClass) this.className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
    if(relationId) this.className += '@_@' + relationId;
    this._queryOptions = {
      only: false,
      distinctKey: '',
      selectCollection: [],
      includeCollection: [],
      conditionCollection: [],
      conditionJoins: '',
      orderCollection: [],
      skip: 0,
      limit: 1000,
    };
  };
  /**
   * 用户查询
   * @param childClass
   * @param relationId
   * @constructor
   */
  CB.UserQuery = function (childClass, relationId) {
    this.className = '_User';
    this.isUserQuery = true;
    if(childClass) {
      this.className = _.isString(childClass) ? childClass : childClass.prototype.className;
      if(relationId) this.className += '@_@' + relationId;
    }
    this._queryOptions = {
      only: false,
      distinctKey: '',
      selectCollection: [],
      includeCollection: [],
      conditionCollection: [],
      conditionJoins: '',
      orderCollection: [],
      skip: 0,
      limit: 1000,
    };
  };
  /**
   * 完全自定义查询
   * @param sql
   * @param params
   * @param client
   * @return {Promise.<*|Promise.<*>>}
   */
  CB.Query.doCloudQuery = async function (sql, params, client) {
    return await CB.crud.custom(sql, params, client)
  };

  CB.Query._extend = CB._extend;

  /**
   * 内建查询
   * @param objectClass
   * @param relationId
   * @constructor
   */
  CB.InnerQuery = function (objectClass, relationId) {
    this.className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
    if(relationId) this.className += '@_@' + relationId;
    this.isInnerQuery = true;
    this._queryOptions = {
      includeCollection: [],
      conditionCollection: [],
      conditionJoins: '',
      orderCollection: [],
    };
  };
  /**
   * 联合查询
   * @param objectClass
   * @param relationId
   * @constructor
   */
  CB.UnionQuery = function (objectClass, relationId) {
    let className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
    if(relationId) className += '@_@' + relationId;
    this._queryOptions = {
      className: className,
      only: false,
      selectCollection: [],
      includeCollection: [],
      conditionCollection: [],
      conditionJoins: '',
    };
  };
  /**
   * 组合联合去重查询[合并为最终查询实例]
   * @param unionQuerys
   * @constructor
   */
  CB.UnionQueryAnd = function (...unionQuerys) {
    const optionsCollection = unionQuerys.map(item => item._queryOptions);
    this.isUnionQuery = true;
    this._unionQueryOptions = {
      queryOptionsCollection: optionsCollection,
      isUnionAll: false,
      orderCollection: [],
      skip: 0,
      limit: 1000,
    };
  };
  /**
   * 组合联合查询[合并为最终查询实例]
   * @param unionQuerys
   * @constructor
   */
  CB.UnionQueryAndAll = function (...unionQuerys) {
    const optionsCollection = unionQuerys.map(item => item._queryOptions);
    this.isUnionQuery = true;
    this._unionQueryOptions = {
      queryOptionsCollection: optionsCollection,
      isUnionAll: true,
      orderCollection: [],
      skip: 0,
      limit: 1000,
    };
  };

  CB.Query.prototype = {
    /**
     * 仅仅查询自己（仅仅在继承表中有作用）
     */
    own: function () {
      this._queryOptions.only = true;
    },
    /**
     * 指定列去重[指定列必须是本表，不能是关联表中的列]（不支持联合查询）
     * @param key
     */
    distinctOn: function (key) {
      this._queryOptions.distinctKey = key;
    },
    /**
     * 查询指定列
     * @param keys
     */
    select: function (...keys) {
      this._queryOptions.selectCollection.push(_.flatten(keys));
    },
    /**
     * 内嵌查询[内嵌的是独立对象][简易版：会完整返回嵌套的子类数据]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.user
     * @param objectClass
     * @param relationId
     */
    include: function (key, objectClass, relationId) {
      if(!objectClass) throw new Error('调用CB.Query的include方法，必须设置第二个参数(objectClass)');
      let className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
      if(relationId) className += '@_@' + relationId;
      let exist = false, _key = `^${key}`;
      for(let item of this._queryOptions.includeCollection) {
        exist = item.key === _key;
        if(exist) {
          _.extend(item, {
            key: _key,
            type: 'single',
            className: className
          });
          break;
        }
      }
      if(!exist) this._queryOptions.includeCollection.push({
        key: _key,
        type: 'single',
        className: className
      });
    },
    /**
     * 内嵌查询[内嵌的是数组对象][简易版：会完整返回嵌套的子类数据]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.levels，该类型只能作为最后一层出现
     * @param objectClass
     * @param relationId
     */
    includeArray: function (key, objectClass, relationId) {
      if(!objectClass) throw new Error('[CB.Query] include方法，必须设置第二个参数(objectClass)');
      let className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
      if(relationId) className += '@_@' + relationId;
      let exist = false, _key = `^${key}`;
      for(let item of this._queryOptions.includeCollection) {
        exist = item.key === _key;
        if(exist) {
          _.extend(item, {
            key: _key,
            type: 'array',
            className: className
          });
          break;
        }
      }
      if(!exist) this._queryOptions.includeCollection.push({
        key: _key,
        type: 'array',
        className: className
      });
    },
    /**
     * 内嵌查询文件
     * @param key
     * @param relationId
     */
    includeFile: function (key, relationId) {
      this.include(key, '_File', relationId);
    },
    /**
     * 内嵌查询文件
     * @param key
     * @param relationId
     */
    includeFiles: function (key, relationId) {
      this.includeArray(key, '_File', relationId);
    },
    /**
     * 内嵌查询[高级版：同简易版，并额外支持条件查询和指定排序]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.user，不支持array类型的嵌套查询！
     * @param object CBObject
     */
    includeQuery: function (key, object) {
      _.remove(this._queryOptions.includeCollection, item => item.key === key);
      if(!(object instanceof CB.InnerQuery)) throw new Error('[CB.Query] matchesQuery方法，查询对象必须使用CB.InnerQuery构建');
      let exist = false, _key = `^${key}`;
      for(let item of this._queryOptions.includeCollection) {
        if(item.key === _key) {
          exist = true;
          _.extend(item, {
            key: _key,
            type: 'single',
            className: object.className,
            conditionJoins: object._queryOptions.conditionJoins,
            conditionCollection: object._queryOptions.conditionCollection,
            orderCollection: object._queryOptions.orderCollection
          });
          break;
        }
      }
      if(!exist) this._queryOptions.includeCollection.push({
        key: _key,
        type: 'single',
        className: object.className,
        conditionJoins: object._queryOptions.conditionJoins,
        conditionCollection: object._queryOptions.conditionCollection,
        orderCollection: object._queryOptions.orderCollection
      });
      object._queryOptions.includeCollection.forEach(innerItem => {
        let exist = false, _key = `^${key}.${innerItem.key.replace(/^\^/, '')}`;
        for(let outerItem of this._queryOptions.includeCollection) {
          if(outerItem.key === _key) {
            exist = true;
            _.extend(outerItem, {
              key: _key,
              type: innerItem.type,
              className: innerItem.className,
            });
            break;
          }
        }
        if(!exist) this._queryOptions.includeCollection.push({
          key: _key,
          type: innerItem.type,
          className: innerItem.className,
        });
      });
    },

    //*****************条件判断集合 start
    //*****************
    _baseCondition: function (key, value, name, type) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        value: value,
        type: type
      });
      return this;
    },
    _jsonCondition: function (key, jsonKey, jsonValue, name, type) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        jsonKey: jsonKey,
        jsonValue: jsonValue,
        type: type
      });
      return this;
    },
    //*************************************基本类型判断
    //*************************************
    /**
     * 值相等
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    equalTo: function (key, value, name) {
      if(value instanceof CB.Object || value instanceof CB.File) {
        return this._jsonCondition(key, 'objectId', value.id, name, 'equalInJson');
      }
      if(_.isArray(value)) {
        if(value.length === 0) {
          throw new Error('equalTo在匹配数组查询时，不能为空！');
        }
        if(value.length === 1) {
          return this.equalTo(key, value[0], name);
        }
        if(value[0] instanceof CB.Object || value[0] instanceof CB.File) {
          const ids = [];
          value.forEach(item => {
            ids.push(item.id);
          });
          return this._jsonCondition(key, 'objectId', ids, name, 'equalInJson');
        }
      }
      return this._baseCondition(key, value, name, 'equal');
    },
    /**
     * 值不相等
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    notEqualTo: function (key, value, name) {
      return this._baseCondition(key, value, name, 'notEqual');
    },
    /**
     * 值大于
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    greaterThan: function (key, value, name) {
      return this._baseCondition(key, value, name, 'greaterThan');
    },
    /**
     * 值大于等于
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    greaterThanOrEqual: function (key, value, name) {
      return this._baseCondition(key, value, name, 'greaterThanOrEqual');
    },
    /**
     * 值小雨
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    lessThan: function (key, value, name) {
      return this._baseCondition(key, value, name, 'lessThan');
    },
    /**
     * 值小于等于
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    lessThanOrEqual: function (key, value, name) {
      return this._baseCondition(key, value, name, 'lessThanOrEqual');
    },
    /**
     * 值前缀
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    prefixText: function (key, value, name) {
      return this._baseCondition(key, value, name, 'prefixText');
    },
    /**
     * 值后缀
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    suffixText: function (key, value, name) {
      return this._baseCondition(key, value, name, 'suffixText');
    },
    /**
     * 值字符包含
     * @param key
     * @param value
     * @param name
     * @return {*}
     */
    containsText: function (key, value, name) {
      return this._baseCondition(key, value, name, 'containsText');
    },
    //*************************************数组类型判断
    //*************************************
    /**
     * [数组属性]全部包含
     * @param key
     * @param array
     * @param name
     */
    containsAllArray: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      if(array[0] instanceof CB.Object || array[0] instanceof CB.File) {
        array = array.map(item => JSON.stringify(item.getPointer()).replace(/"/g, '\\"'));
      }
      return this._baseCondition(key, array, name, 'containsAllArray');
    },
    /**
     * [数组属性]全部不包含
     * @param key
     * @param array
     * @param name
     */
    notContainAllArray: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      if(array[0] instanceof CB.Object || array[0] instanceof CB.File) {
        array = array.map(item => JSON.stringify(item.getPointer()).replace(/"/g, '\\"'));
      }
      return this._baseCondition(key, array, name, 'notContainAllArray');
    },
    /**
     * [数组属性]包含指定元素
     * @param key
     * @param array
     * @param name
     */
    containsInArray: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      if(array[0] instanceof CB.Object || array[0] instanceof CB.File) {
        array = array.map(item => JSON.stringify(item.getPointer()).replace(/"/g, '\\"'));
      }
      return this._baseCondition(key, array, name, 'containsInArray');
    },
    /**
     * [数组属性]不包含指定元素
     * @param key
     * @param array
     * @param name
     */
    notContainInArray: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      if(array[0] instanceof CB.Object || array[0] instanceof CB.File) {
        array = array.map(item => JSON.stringify(item.getPointer()).replace(/"/g, '\\"'));
      }
      return this._baseCondition(key, array, name, 'notContainInArray');
    },
    /**
     * [数组属性]被包含指定元素
     * @param key
     * @param array
     * @param name
     */
    containedByArray: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      if(array[0] instanceof CB.Object || array[0] instanceof CB.File) {
        array = array.map(item => JSON.stringify(item.getPointer()).replace(/"/g, '\\"'));
      }
      return this._baseCondition(key, array, name, 'containedByArray');
    },
    /**
     * [数组属性]与指定元素有重叠
     * @param key
     * @param array
     * @param name
     */
    overlapInArray: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      if(array[0] instanceof CB.Object || array[0] instanceof CB.File) {
        array = array.map(item => JSON.stringify(item.getPointer()).replace(/"/g, '\\"'));
      }
      return this._baseCondition(key, array, name, 'overlapInArray');
    },
    /**
     * [数组属性]数组长度匹配
     * @param key
     * @param dimension 维度
     * @param length
     * @param name
     * @return {CB}
     */
    lengthInArray: function (key, dimension = 1, length, name) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        dim: dimension,
        value: length,
        type: 'lengthInArray'
      });
      return this;
    },
    //*************************************JSON类型判断
    //*************************************
    /**
     * [JSON属性]元素相等
     * @param key
     * @param jsonKey
     * @param jsonValue
     * @param name
     */
    equalInJson: function (key, jsonKey, jsonValue, name) {
      return this._jsonCondition(key, jsonKey, jsonValue, name, 'equalInJson');
    },
    /**
     * [JSON属性]元素不相等
     * @param key
     * @param jsonKey
     * @param jsonValue
     * @param name
     */
    notEqualInJson: function (key, jsonKey, jsonValue, name) {
      return this._jsonCondition(key, jsonKey, jsonValue, name, 'notEqualInJson');
    },
    /**
     * [JSON属性]元素大于
     * @param key
     * @param jsonKey
     * @param jsonValue
     * @param name
     */
    greaterThanInJson: function (key, jsonKey, jsonValue, name) {
      return this._jsonCondition(key, jsonKey, jsonValue, name, 'greaterThanInJson');
    },
    /**
     * [JSON属性]元素大于等于
     * @param key
     * @param jsonKey
     * @param jsonValue
     * @param name
     */
    greaterThanOrEqualInJson: function (key, jsonKey, jsonValue, name) {
      return this._jsonCondition(key, jsonKey, jsonValue, name, 'greaterThanOrEqualInJson');
    },
    /**
     * [JSON属性]元素小于
     * @param key
     * @param jsonKey
     * @param jsonValue
     * @param name
     */
    lessThanInJson: function (key, jsonKey, jsonValue, name) {
      return this._jsonCondition(key, jsonKey, jsonValue, name, 'lessThanInJson');
    },
    /**
     * [JSON属性]元素小于等于
     * @param key
     * @param jsonKey
     * @param jsonValue
     * @param name
     */
    lessThanOrEqualInJson: function (key, jsonKey, jsonValue, name) {
      return this._jsonCondition(key, jsonKey, jsonValue, name, 'lessThanOrEqualInJson');
    },
    /**
     * [JSON属性]存在某个key
     * @param key
     * @param value
     * @param name
     */
    existKeyInJson: function (key, value, name) {
      return this._baseCondition(key, value, name, 'existKeyInJson');
    },
    /**
     * [JSON属性]存在多个key中的任意一个
     * @param key
     * @param array
     * @param name
     */
    existAnyKeysInJson: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      return this._baseCondition(key, array, name, 'existAnyKeysInJson');
    },
    /**
     * [JSON属性]存在指定的全部key
     * @param key
     * @param array
     * @param name
     */
    existAllKeysInJson: function (key, array, name) {
      array = _.isArray(array) ? array : [array];
      return this._baseCondition(key, array, name, 'existAllKeysInJson');
    },
    /**
     * [JSON属性]包含指定对象
     * @param key
     * @param object
     * @param name
     */
    containsInJson: function (key, object, name) {
      return this._baseCondition(key, object, name, 'lessThanOrEqualInJson');
    },
    /**
     * [JSON属性]被包含指定对象
     * @param key
     * @param object
     * @param name
     */
    containedByJson: function (key, object, name) {
      return this._baseCondition(key, object, name, 'lessThanOrEqualInJson');
    },
    //*************************************其它
    //*************************************
    /**
     * 属性值存在
     * @param key
     * @param name
     */
    exist: function (key, name) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        type: 'exist'
      });
      return this;
    },
    /**
     * 属性值不存在
     * @param key
     * @param name
     */
    notExist: function (key, name) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        type: 'notExist'
      });
      return this;
    },
    //*****************
    //*****************条件判断集合 end
    /**
     * 条件查询拼接
     * @param string 例如：name1 && (name2 || name3)
     */
    conditionJoins: function (string) {
      this._queryOptions.conditionJoins = string;
      return this;
    },
    /**
     * 正排序
     * @param key
     * @param action [top：置顶 | bottom：置底]
     */
    ascending: function (key, action) {
      this._queryOptions.orderCollection.push({
        key: key,
        type: 'asc',
        action: action
      });
      return this;
    },
    /**
     * 倒排序
     * @param key
     * @param action [top：置顶 | bottom：置底]
     */
    descending: function (key, action) {
      this._queryOptions.orderCollection.push({
        key: key,
        type: 'desc',
        action: action
      });
      return this;
    },
    /**
     * 跳过数量
     * @param number
     */
    skip: function (number) {
      this._queryOptions.skip = number;
      return this;
    },
    /**
     * 查询数量限定
     * @param number
     */
    limit: function (number) {
      this._queryOptions.limit = number;
      return this;
    },

    /**
     * 根据指定objectId获取数据
     * @param objectId
     * @param client
     */
    get: async function (objectId, client) {
      if(!objectId) throw new Error("[CB QUERY ERROR] objectId not found.");
      this.equalTo('objectId', objectId);
      return await this.first(client);
    },
    /**
     * 获取数据集合
     * @param client
     * @return {Promise.<void>}
     */
    find: async function (client) {
      const data = await CB.crud.find(this.className, 'find', this._unionQueryOptions || this._queryOptions, client);
      if(data.length === 0) return [];
      return data.map((item) => {
        if(this.isUserQuery) {
          return new CB.User(_.extend(item, {
            className: this.className
          }));
        }
        return new CB.Object(_.extend(item, {
          className: this.className
        }));
      });
    },
    /**
     * 获取单条数据
     * @param client
     * @return {Promise.<void>}
     */
    first: async function (client) {
      const data = await CB.crud.find(this.className, 'first', this._unionQueryOptions || this._queryOptions, client);
      if(!data) return null;
      if(this.isUserQuery) {
        return new CB.User(_.extend(data, {
          className: this.className
        }));
      }
      return new CB.Object(_.extend(data, {
        className: this.className
      }));
    },
    /**
     * 获取数据数量
     * @param client
     * @return {Promise.<void>}
     */
    count: async function (client) {
      return await CB.crud.find(this.className, 'count', this._unionQueryOptions || this._queryOptions, client);
    }
  };

  CB.UserQuery.prototype = _.clone(CB.Query.prototype);
  CB.InnerQuery.prototype = _.clone(CB.Query.prototype);
  CB.UnionQuery.prototype = _.clone(CB.Query.prototype);
  CB.UnionQueryAnd.prototype = _.clone(CB.Query.prototype);
  CB.UnionQueryAndAll.prototype = _.clone(CB.Query.prototype);


};
