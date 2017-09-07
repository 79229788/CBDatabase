const _ = require('lodash');

module.exports = function (CB) {
  /**
   * 通用查询
   * @param objectClass
   * @constructor
   */
  CB.Query = function (objectClass) {
    this.className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
    this._queryOptions = {
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
   * @constructor
   */
  CB.UserQuery = function (childClass) {
    this.className = '_User';
    this.isUserQuery = true;
    if(childClass) this.className = _.isString(childClass) ? childClass : childClass.prototype.className;
    this._queryOptions = {
      selectCollection: [],
      includeCollection: [],
      conditionCollection: [],
      conditionJoins: '',
      orderCollection: [],
      skip: 0,
      limit: 1000,
    };
  };

  CB.Query._extend = CB._extend;

  /**
   * 内建查询
   * @param objectClass
   * @constructor
   */
  CB.InnerQuery = function (objectClass) {
    this.className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
    this._queryOptions = {
      conditionCollection: [],
      conditionJoins: '',
      orderCollection: [],
    };
  };

  CB.Query.prototype = {
    /**
     * 查询指定列
     * @param keys
     */
    select: function (...keys) {
      this._queryOptions.selectCollection.push(keys);
    },
    /**
     * 内嵌查询[内嵌的是独立对象][简易版：会完整返回嵌套的子类数据]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.user
     * @param objectClass
     */
    include: function (key, objectClass) {
      if(!objectClass) throw new Error('调用CB.Query的include方法，必须设置第二个参数(objectClass)');
      const className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
      this._queryOptions.includeCollection.push({
        key: '^' + key,
        type: 'single',
        className: className
      });
    },
    /**
     * 内嵌查询[内嵌的是数组对象][简易版：会完整返回嵌套的子类数据]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.levels，该类型只能作为最后一层出现
     * @param objectClass
     * @param orderKey 字段
     * @param orderBy 字段
     */
    includeArray: function (key, objectClass, orderKey = 'createdAt', orderBy = 'asc') {
      if(!objectClass) throw new Error('[CB.Query] include方法，必须设置第二个参数(objectClass)');
      const className = _.isString(objectClass) ? objectClass : objectClass.prototype.className;
      this._queryOptions.includeCollection.push({
        key: '^' + key,
        type: 'array',
        className: className,
        orderKey: orderKey,
        orderBy: orderBy
      });
    },
    /**
     * 内嵌查询文件
     * @param key
     */
    includeFile: function (key) {
      this.include(key, '_File');
    },
    /**
     * 内嵌查询[高级版：同简易版，并额外支持条件查询和指定排序]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.user，不支持array类型的嵌套查询！
     * @param object CBObject
     */
    matchesQuery: function (key, object) {
      _.remove(this._queryOptions.includeCollection, item => item.key === key);
      if(!(object instanceof CB.InnerQuery)) throw new Error('[CB.Query] matchesQuery方法，查询对象必须使用CB.InnerQuery构建');
      this._queryOptions.includeCollection.push({
        key: '^' + key,
        type: 'single',
        className: object.className,
        conditionJoins: object._queryOptions.conditionJoins,
        conditionCollection: object._queryOptions.conditionCollection,
        orderCollection: object._queryOptions.orderCollection
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
    },
    _jsonCondition: function (key, jsonKey, jsonValue, name, type) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        jsonKey: jsonKey,
        jsonValue: jsonValue,
        type: type
      });
    },
    //*****基本类型判断
    equalTo: function (key, value, name) {
      if(value instanceof CB.Object) return this._jsonCondition(key, 'objectId', value.id, name, 'equalInJson');
      this._baseCondition(key, value, name, 'equal');
    },
    notEqualTo: function (key, value, name) {
      this._baseCondition(key, value, name, 'notEqual');
    },
    greaterThan: function (key, value, name) {
      this._baseCondition(key, value, name, 'greaterThan');
    },
    greaterThanOrEqual: function (key, value, name) {
      this._baseCondition(key, value, name, 'greaterThanOrEqual');
    },
    lessThan: function (key, value, name) {
      this._baseCondition(key, value, name, 'lessThan');
    },
    lessThanOrEqual: function (key, value, name) {
      this._baseCondition(key, value, name, 'lessThanOrEqual');
    },
    prefixText: function (key, value, name) {
      this._baseCondition(key, value, name, 'prefixText');
    },
    suffixText: function (key, value, name) {
      this._baseCondition(key, value, name, 'suffixText');
    },
    containsText: function (key, value, name) {
      this._baseCondition(key, value, name, 'containsText');
    },
    //*****数组类型判断
    containsAllArray: function (key, value, name) {
      this._baseCondition(key, value, name, 'containsAllArray');
    },
    notContainAllArray: function (key, value, name) {
      this._baseCondition(key, value, name, 'notContainAllArray');
    },
    containsInArray: function (key, value, name) {
      this._baseCondition(key, value, name, 'containsInArray');
    },
    notContainInArray: function (key, value, name) {
      this._baseCondition(key, value, name, 'notContainInArray');
    },
    containedByArray: function (key, value, name) {
      this._baseCondition(key, value, name, 'containedByArray');
    },
    overlapInArray: function (key, value, name) {
      this._baseCondition(key, value, name, 'overlapInArray');
    },
    //*****JSON类型判断
    equalInJson: function (key, jsonKey, jsonValue, name) {
      this._jsonCondition(key, jsonKey, jsonValue, name, 'equalInJson');
    },
    notEqualInJson: function (key, jsonKey, jsonValue, name) {
      this._jsonCondition(key, jsonKey, jsonValue, name, 'notEqualInJson');
    },
    greaterThanInJson: function (key, jsonKey, jsonValue, name) {
      this._jsonCondition(key, jsonKey, jsonValue, name, 'greaterThanInJson');
    },
    greaterThanOrEqualInJson: function (key, jsonKey, jsonValue, name) {
      this._jsonCondition(key, jsonKey, jsonValue, name, 'greaterThanOrEqualInJson');
    },
    lessThanInJson: function (key, jsonKey, jsonValue, name) {
      this._jsonCondition(key, jsonKey, jsonValue, name, 'lessThanInJson');
    },
    lessThanOrEqualInJson: function (key, jsonKey, jsonValue, name) {
      this._jsonCondition(key, jsonKey, jsonValue, name, 'lessThanOrEqualInJson');
    },
    existKeyInJson: function (key, value, name) {
      this._baseCondition(key, value, name, 'existKeyInJson');
    },
    existAnyKeysInJson: function (key, value, name) {
      this._baseCondition(key, value, name, 'existAnyKeysInJson');
    },
    existAllKeysInJson: function (key, value, name) {
      this._baseCondition(key, value, name, 'existAllKeysInJson');
    },
    containsInJson: function (key, value, name) {
      this._baseCondition(key, value, name, 'containsInJson');
    },
    containedByJson: function (key, value, name) {
      this._baseCondition(key, value, name, 'containedByJson');
    },
    //*****其它
    exist: function (key, name) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        type: 'exist'
      });
    },
    notExist: function (key, name) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        type: 'notExist'
      });
    },
    //*****************
    //*****************条件判断集合 end
    /**
     * 条件查询拼接
     * @param string 例如：name1 && (name2 || name3)
     */
    conditionJoins: function (string) {
      this._queryOptions.conditionJoins = string;
    },
    /**
     * 正排序
     * @param key
     */
    ascending: function (key) {
      this._queryOptions.orderCollection.push({
        key: key,
        type: 'asc'
      });
    },
    /**
     * 倒排序
     * @param key
     */
    descending: function (key) {
      this._queryOptions.orderCollection.push({
        key: key,
        type: 'desc'
      });
    },
    /**
     * 跳过数量
     * @param number
     */
    skip: function (number) {
      this._queryOptions.skip = number;
    },
    /**
     * 查询数量限定
     * @param number
     */
    limit: function (number) {
      this._queryOptions.limit = number;
    },

    /**
     * 根据指定objectId获取数据
     * @param objectId
     * @param client
     */
    get: async function (objectId, client) {
      if(!objectId) throw new Error("[CB QUERY ERROR] objectId not found.");
      const query = new CB.Query(this.className);
      query._queryOptions = _.cloneDeep(this._queryOptions);
      query.equalTo('objectId', objectId);
      return await query.first(client);
    },
    /**
     * 获取数据集合
     * @param client
     * @return {Promise.<void>}
     */
    find: async function (client) {
      const data = await CB.crud.find(this.className, 'find', this._queryOptions, client);
      if(data.length === 0) return [];
      return data.map((item) => {
        if(this.isUserQuery) {
          const user = new CB.User(item, {serverData: true});
          user.setChildClass(this.className);
          return user;
        }
        const object = new CB.Object(item, {serverData: true});
        object._className = this.className;
        return object;
      });
    },
    /**
     * 获取单条数据
     * @param client
     * @return {Promise.<void>}
     */
    first: async function (client) {
      const data = await CB.crud.find(this.className, 'first', this._queryOptions, client);
      if(!data) return null;
      if(this.isUserQuery) {
        const user = new CB.User(data, {serverData: true});
        user.setChildClass(this.className);
        return user;
      }
      const object = new CB.Object(data, {serverData: true});
      object._className = this.className;
      return object;
    },
    /**
     * 获取数据数量
     * @param client
     * @return {Promise.<void>}
     */
    count: async function (client) {
      return await CB.crud.find(this.className, 'count', this._queryOptions, client);
    }
  };

  CB.InnerQuery.prototype = _.clone(CB.Query.prototype);
  CB.UserQuery.prototype = _.clone(CB.Query.prototype);

};
