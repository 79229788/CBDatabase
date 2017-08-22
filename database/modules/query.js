const _ = require('lodash');

module.exports = function (CB) {
  CB.Query = function (objectClass) {
    if(_.isString(objectClass)) objectClass = CB.Object._getSubclass(objectClass);
    this.objectClass = objectClass;
    this.className = objectClass.prototype.className;

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

  CB.InnerQuery = function (objectClass) {
    if(_.isString(objectClass)) objectClass = CB.Object._getSubclass(objectClass);
    this.objectClass = objectClass;
    this.className = objectClass.prototype.className;

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
      this._queryOptions.includeCollection.push({
        key: '^' + key,
        type: 'single',
        className: objectClass.prototype.className
      });
    },
    /**
     * 内嵌查询[内嵌的是数组对象][简易版：会完整返回嵌套的子类数据]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.levels，该类型只能作为最后一层出现
     * @param objectClass
     */
    includeArray: function (key, objectClass) {
      this._queryOptions.includeCollection.push({
        key: '^' + key,
        type: 'array',
        className: objectClass.prototype.className
      });
    },
    /**
     * 内嵌查询[高级版：同简易版，并额外支持条件查询和指定排序]
     * @param key 查询字段（支持5层嵌套，嵌套连接请使用"."）
     * 例如：product.cate.user，不支持array类型的嵌套查询！
     * @param object CBObject
     */
    matchesQuery: function (key, object) {
      _.remove(this._queryOptions.includeCollection, item => item.key === key);
      if(!(object instanceof CB.InnerQuery)) throw new Error('[CB QUERY ERROR] matchesQuery 必须使用CB.InnerQuery构建');
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
    _jsonCondition: function (key, value, jsonKey, jsonValue, name, type) {
      this._queryOptions.conditionCollection.push({
        name: name || '',
        key: key,
        value: value,
        jsonKey: jsonKey,
        jsonValue: jsonValue,
        type: type
      });
    },
    //*****基本类型判断
    equalTo: function (key, value, name) {
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
    equalInJson: function (key, value, jsonKey, jsonValue, name) {
      this._jsonCondition(key, value, jsonKey, jsonValue, name, 'equalInJson');
    },
    notEqualInJson: function (key, value, jsonKey, jsonValue, name) {
      this._jsonCondition(key, value, jsonKey, jsonValue, name, 'notEqualInJson');
    },
    greaterThanInJson: function (key, value, jsonKey, jsonValue, name) {
      this._jsonCondition(key, value, jsonKey, jsonValue, name, 'greaterThanInJson');
    },
    greaterThanOrEqualInJson: function (key, value, jsonKey, jsonValue, name) {
      this._jsonCondition(key, value, jsonKey, jsonValue, name, 'greaterThanOrEqualInJson');
    },
    lessThanInJson: function (key, value, jsonKey, jsonValue, name) {
      this._jsonCondition(key, value, jsonKey, jsonValue, name, 'lessThanInJson');
    },
    lessThanOrEqualInJson: function (key, value, jsonKey, jsonValue, name) {
      this._jsonCondition(key, value, jsonKey, jsonValue, name, 'lessThanOrEqualInJson');
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
      return await CB.crud.find(this.className, 'find', this._queryOptions, client);
    },
    /**
     * 获取单条数据
     * @param client
     * @return {Promise.<void>}
     */
    first: async function (client) {
      return await CB.crud.find(this.className, 'first', this._queryOptions, client);
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

  CB.InnerQuery.prototype = CB.Query.prototype;

};
