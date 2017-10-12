const _ = require('lodash');
const utils = require('../utils');
const RESERVED_KEYS = ['objectId', 'createdAt', 'updatedAt'];
const checkReservedKey = function checkReservedKey(key) {
  if(key.indexOf('^') > -1 || key.indexOf('.') > -1) {
    throw new Error('[CBOBJECT ERROR] 字段命名中不允许使用.和^，请修改后重试！');
  }
  if(RESERVED_KEYS.indexOf(key) !== -1) {
    throw new Error('key[' + key + '] is reserved');
  }
};

module.exports = function (CB) {
  CB.Object = function (attributes, options) {
    attributes = attributes || {};
    options = options || {};
    if(_.isString(attributes)) {
      attributes = {objectId: attributes};
      options.serverData = true;
    }
    if(attributes.constructor === this.constructor) attributes = attributes.toOrigin();
    this.parseDefaultDate(attributes);
    this.cid = _.uniqueId('c');
    this._serverData = options.serverData || false;
    this._hasData = options.hasData || true;
    this.set(attributes);
    this._previousAttributes = _.cloneDeep(this.attributes);
    this.init.apply(this, arguments);
  };

  _.extend(CB.Object.prototype, {
    _type: '',
    _className: '',
    _observeObjectId: true,
    /**
     * 初始化
     */
    init: function() {},
    /**
     * 解析默认日期属性
     * @param object
     * @return {*}
     */
    parseDefaultDate: function (object) {
      const output = _.clone(object);
      (['createdAt', 'updatedAt']).forEach((key) => {
        if(output[key]) output[key] = CB._parseDate(output[key]);
      });
      if(output.createdAt && !output.updatedAt) output.updatedAt = output.createdAt;
    },

    getObjectId: function () {
      return this.id;
    },

    getCreatedAt: function () {
      return this.get('createdAt');
    },

    getUpdatedAt: function () {
      return this.get('updatedAt');
    },
    /**
     * 是否已被修改（修改对象id不会触发更新）
     * @return {boolean}
     */
    isChanged: function () {
      return !_.isEqual(this.attributes, this._previousAttributes);
    },
    /**
     * 获取数据
     * @param attr
     * @return {*}
     */
    get: function (attr) {
      switch (attr) {
        case 'objectId':
          return this.id;
        default:
          return this.attributes[attr];
      }
    },
    /**
     * 设置数据
     * @param key
     * @param value
     * @return {CB}
     */
    set: function (key, value) {
      if(!key) return this;
      let attrs = this.attributes || {};
      if(_.isObject(key)) {
        const object = {};
        _.each(key, (v, k) => {
          if(!this._serverData) checkReservedKey(k);
          object[k] = CB._encode(v, k);
        });
        attrs = _.extend({}, this.attributes, object);
      }else {
        if(!this._serverData) checkReservedKey(key);
        attrs[key] = CB._encode(value, key);
      }
      if(attrs.objectId) this.id = attrs.objectId;
      if(attrs.className) this._className = attrs.className;
      if(attrs.__type) this._type = attrs.__type;
      this.attributes = attrs;
      delete this.attributes.objectId;
      delete this.attributes.className;
      delete this.attributes.__type;
      return this;
    },
    /**
     * 取消设置key
     * @param keys
     */
    unset: function (keys) {
      keys = _.isArray(keys) ? keys : [keys];
      keys.forEach(key => {
        delete this.attributes[key];
      });
    },
    /**
     * 设置增量数据
     * @param key
     * @param value
     * @return {CB}
     */
    increment: function (key, value) {
      if(!key) return this;
      if(!_.isNumber(value)) throw new Error('increment value must be number!');
      delete this.attributes[key];
      this.set(key + ':[action]increment', value);
      return this;
    },
    /**
     * 给数组属性添加元素(在后面追加)
     * @param key
     * @param value
     * @return {CB}
     */
    append: function (key, value) {
      if(!key) return this;
      delete this.attributes[key];
      this.set(key + ':[action]append', value);
      return this;
    },
    /**
     * 给数组属性添加元素(在前面插入)
     * @param key
     * @param value
     * @return {CB}
     */
    prepend: function (key, value) {
      if(!key) return this;
      delete this.attributes[key];
      this.set(key + ':[action]prepend', value);
      return this;
    },
    /**
     * 给数组属性连接一个新数组
     * @param key
     * @param array
     * @return {CB}
     */
    concat: function (key, array) {
      if(!key) return this;
      delete this.attributes[key];
      this.set(key + ':[action]concat', array);
      return this;
    },
    /**
     * 给数组属性移除元素
     * @param key
     * @param value
     * @return {CB}
     */
    remove: function (key, value) {
      if(!key) return this;
      delete this.attributes[key];
      this.set(key + ':[action]remove', value);
      return this;
    },
    /**
     * 创建一个Relation实例
     * @param parentClass Relation的父类(继承类)
     * @param _relationId (可选)自定义子类id
     * @return {Relation}
     */
    createRelation: function (parentClass, _relationId) {
      return new CB.Relation(parentClass, _relationId, null);
    },
    /**
     * 获取关系表
     * @param attr
     * @return {*}
     */
    getRelation: function (attr) {
      const value = this.get(attr);
      if(!value || !(value instanceof CB.Relation)) throw new Error("Called getRelation() on non-relation field " + attr);
      value.parent = this;
      return value;
    },
    /**
     * 克隆模型
     * @return {*}
     */
    clone: function() {
      return _.cloneDeep(this);
    },
    /**
     * 转化为json
     * @return {string}
     */
    toJSON: function () {
      return JSON.stringify(this.toOrigin());
    },
    /**
     * 转化为原始数据
     * @return {object}
     */
    toOrigin: function () {
      return CB._decode(this);
    },
    /**
     * 转化为将要保存的原始数据（过滤掉未更新的属性）
     * @return {object}
     */
    _toSaveOrigin: function () {
      const curr = this.clone();
      const prev = new CB.Object(this._previousAttributes, {serverData: true});
      const saveObject = {};
      for(let key of Object.keys(curr.attributes)) {
        const value = curr.attributes[key];
        if(_.isArray(value) && (value[0] instanceof CB.Object || value[0] instanceof CB.File)) {
          if(!prev.get(key) || !_.isEqual(value.map(item => item.getPointer()), prev.get(key).map(item => item.getPointer()))) {
            const items = [];
            value.forEach((item) => {
              if(item.id) items.push(item.getPointer());
            });
            saveObject[key] = items;
          }
          continue;
        }
        if(value instanceof CB.Object || value instanceof CB.File) {
          if(!prev.get(key) || value.id && !_.isEqual(value.getPointer(), prev.get(key).getPointer())) {
            saveObject[key] = value.getPointer();
          }
          continue;
        }
        if(value instanceof CB.Relation) {
          if(!prev.get(key) || value.relationId && value.className && !_.isEqual(value.getPointer(), prev.get(key).getPointer())) {
            saveObject[key] = value.getPointer();
          }
          continue;
        }
        if(!_.isEqual(value, prev.get(key))) {
          saveObject[key] = value;
        }
      }
      if(_.size(saveObject) > 0 && curr.id) saveObject.objectId = curr.id;
      return saveObject;
    },
    /**
     * 获取当前的引用对象(无完整数据）
     */
    getPointer: function () {
      return {
        __type: "Pointer",
        className: this.className,
        objectId: this.id
      };
    },
    /**
     * 获取所有子类
     * @return *{有子类的属性key: 对应的models};
     */
    getChildren: function () {
      const child = {};
      _.each(this.attributes, (value, key) => {
        if(_.isArray(value)) {
          value.forEach((item) => {
            insert(item, key);
          });
        }else {
          insert(value, key);
        }
      });
      function insert(model, key) {
        if(model instanceof CB.Object || model instanceof CB.File) {
          if(!child[key]) child[key] = [];
          child[key].push(model);
        }
      }
      return child;
    },
    /**
     * [深度]获取所有子类）
     * @return *{有子类的属性key: 对应的models};
     */
    getChildrenDeep: function () {
      const child = {};
      (function traverse(object, key) {
        if(object instanceof CB.Object || object instanceof CB.File) {
          if(object instanceof CB.Object) traverse(object.attributes, key);
          if(key) {
            if(!child[key]) child[key] = [];
            child[key].push(object);
          }
          return;
        }
        if(_.isArray(object)) {
          object.forEach(item => {
            traverse(item, key);
          });
          return;
        }
        if(_.isObject(object)) {
          _.each(object, function (value, key) {
            traverse(value, key);
          });
        }
      })(this);
      return child;
    },
    /**
     * 改变class
     * @param className
     */
    changeClass: function (className) {
      this._className = _.isString(className) ? className : className.prototype.className;
    },
    /**
     * 设置保存时的查询
     * @param query
     */
    setQuery: function (query) {
      if(!(query instanceof CB.Query)) throw new Error('setQuery方法的query参数必须为CB.Query实例');
      this._queryCondition = query._queryOptions.conditionCollection;
    },
    /**
     * 保存数据
     * @return {*}
     */
    save: async function (client) {
      this._observeObjectId = true;
      return await CB.Object._deepSaveAsync(this, client);
    },
    /**
     * 更新数据[不根据objectId的更新方式]
     * @param client
     * @return {Promise.<void>}
     */
    update: async function(client) {
      this._observeObjectId = false;
      return await CB.Object._deepSaveAsync(this, client);
    },
    /**
     * 删除对象
     * @param client
     * @return {Promise.<CB>}
     */
    destroy: async function(client) {
      return await CB.crud.delete(this.className, {
        objectId: this.id
      }, this._queryCondition, client);
    },

  });
  /**
   * 保存全部对象
   * @param list
   * @param client
   */
  CB.Object.saveAll = async function (list, client) {
    const savedModels = [];
    for(let model of _.flattenDeep(list)) {
      if(model) savedModels.push(await CB.Object._deepSaveAsync(model, client));
    }
    return savedModels;
  };
  /**
   * 批量删除对象
   * @param list
   * @param client
   * @return {Promise.<Array>}
   */
  CB.Object.destroyAll = async function (list, client) {
    const flattenModels = _.flattenDeep(list);
    const groupModels = _.groupBy(flattenModels, item => item.className);
    for(let className of Object.keys(groupModels)) {
      const items = groupModels[className];
      if(items.length > 1) {
        await CB.crud.delete(className, {
          'objectId:batch': items.map(item => item.id)
        }, this._queryCondition, client);
      }else if(items.length === 1) {
        await CB.crud.delete(className, {
          'objectId': items[0].id
        }, this._queryCondition, client);
      }
    }
  };
  /**
   * 深度查找未保存的子项
   * @param model
   * @param children
   * @param files
   * @private
   */
  CB.Object._deepFindUnsavedChildren = function (model, children, files) {
    children = children || [];
    files = files || [];
    CB._traverse(model.attributes, (value) => {
      if(value instanceof CB.Object) {
        if(value.isChanged()) children.push(value);
      }else if(value instanceof CB.File) {
        if(!value.id) files.push(value);
      }
    });
  };
  /**
   * 深度保存对象(内部所有子对象均为全部保存)
   * @param model
   * @param client
   * @private
   */
  CB.Object._deepSaveAsync = async function (model, client) {
    //***先保存当前模型所有子类
    const children = model.getChildrenDeep();
    for(let key of Object.keys(children)) {
      const childModels = children[key];
      for(child of childModels) {
        if(child instanceof CB.File && !child.id) {
          await child.save(client);
        }else if(child instanceof CB.Object && child.isChanged()) {
          const saveObject = child._toSaveOrigin();
          const savedData = child._observeObjectId
            ? await CB.crud.save(child.className, saveObject, child._queryCondition, client)
            : await CB.crud.update(child.className, saveObject, child._queryCondition, client);
          CB.Object._assignSavedData(savedData, child);
        }
      }
    }
    //***再保存当前模型
    const saveObject = model._toSaveOrigin();
    const savedData = model._observeObjectId
      ? await CB.crud.save(model.className, saveObject, model._queryCondition, client)
      : await CB.crud.update(model.className, saveObject, model._queryCondition, client);
    if(!savedData) return null;
    CB.Object._assignSavedData(savedData, model);
    return model;
  };
  /**
   * 把已保存的原生服务器数据，传递到模型中(主要是传递objectId和附带特殊动作的属性)
   * @param savedData
   * @param model
   * @private
   */
  CB.Object._assignSavedData = function (savedData, model) {
    if(!savedData || JSON.stringify(savedData) === '{}') return;
    model.id = savedData.objectId;
    _.each(model.attributes, (value, key) => {
      if(key.indexOf(':[action]') > 0) {
        const _key = key.split(':[action]')[0];
        model.attributes[_key] = savedData[_key] || null;
        delete model.attributes[key];
      }
    });
    model._previousAttributes = _.cloneDeep(model.attributes);
  };
  /**
   * 获取关系表ClassName
   * @param relationId
   * @return {string}
   */
  CB.Object.relationClass = function (relationId) {
    if(!relationId) throw new Error('调用relationClass方法，参数relationId不允许为空！');
    return this.prototype.className + '@_@' + relationId;
  };


  //********************************其它
  //********************************
  //********************************
  CB.Object._classMap = {};
  CB.Object._extend = CB._extend;
  CB.Object.extend = function (className, protoProps, classProps) {
    if(!_.isString(className)) {
      if (className && _.has(className, "className")) {
        return CB.Object.extend(className.className, className, protoProps);
      } else {
        throw new Error("CB.Object.extend's first argument should be the className.");
      }
    }
    if(className === 'User') className = '_User';
    if(className === 'File') className = '_File';

    let NewClassObject = null;
    if(_.has(CB.Object._classMap, className)) {
      const OldClassObject = CB.Object._classMap[className];
      if(protoProps || classProps) {
        NewClassObject = OldClassObject._extend(protoProps, classProps);
      }else {
        return OldClassObject;
      }
    }else {
      protoProps = protoProps || {};
      protoProps._className = className;
      NewClassObject = this._extend(protoProps, classProps);
    }
    CB.Object._classMap[className] = NewClassObject;
    return NewClassObject;
  };

  Object.defineProperty(CB.Object.prototype, 'className', {
    get: function () {
      return this._className;
    }
  });

};
