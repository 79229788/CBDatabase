const _ = require('lodash');
const utils = require('./utils');
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
    if (_.isString(attributes)) return CB.Object._create.apply(this, arguments);
    attributes = attributes || {};
    if(attributes.constructor === this.constructor) attributes = attributes.toOrigin();
    this.parseDefaultDate(attributes);
    this.cid = _.uniqueId('c');
    this._serverData = (options || {}).serverData || false;
    this._hasData = true;
    this.set(attributes);
    const previous = this.toOrigin();
    delete previous.objectId;
    this._previousModel = this.clone();
    this._previousAttributes = previous;
    this.init.apply(this, arguments);
  };

  _.extend(CB.Object.prototype, {

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
      const current = this.toOrigin();
      delete current.objectId;
      return !_.isEqual(current, this._previousAttributes);
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
    set: function set(key, value) {
      if(!key) return this;
      let attrs = this.attributes || {};
      if (_.isObject(key)) {
        const object = {};
        _.each(key, (v, k) => {
          if(!this._serverData) checkReservedKey(k);
          object[k] = CB._encode(v, k);
        });
        attrs = _.extend({}, this.attributes, object);
      } else {
        if(!this._serverData) checkReservedKey(key);
        attrs[key] = CB._encode(value, key);
      }
      if(attrs.objectId) {
        this.id = attrs.objectId;
        delete attrs.objectId;
      }
      this.attributes = attrs;
      return this;
    },
    /**
     * 设置增量数据
     * @param key
     * @param value
     * @return {CB}
     */
    increment: function (key, value) {
      if(!_.isInteger(value)) throw new Error('increment value must be number!');
      delete this.attributes[key];
      this.set(key + ':increment', parseInt(value));
      return this;
    },
    /**
     * 获取关系表
     * @param attr
     * @return {*}
     */
    relation: function (attr) {
      const value = this.get(attr);
      if(value) {
        if(!(value instanceof CB.Relation)) throw new Error("Called relation() on non-relation field " + attr);
        value.parent = this;
        return value;
      } else {
        return new CB.Relation(this, attr);
      }
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
      const prev = this._previousModel;
      const saveObject = {};
      for(let key of Object.keys(curr.attributes)) {
        const value = curr.attributes[key];
        if(_.isArray(value) && (
          value[0] instanceof CB.Object
          || value[0] instanceof CB.File
          || value instanceof CB.Relation)) {
          if(!_.isEqual(value.map(item => item.getPointer()), prev.get(key).map(item => item.getPointer()))) {
            const items = [];
            value.forEach((item) => {
              if(item.id) items.push(item.getPointer());
            });
            saveObject[key] = items;
          }
          continue;
        }
        if(value instanceof CB.Object
          || value instanceof CB.File
          || value instanceof CB.Relation) {
          if(value.id && !_.isEqual(value.getPointer(), prev.get(key).getPointer())) {
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
     * 获取所有子类（不是深度获取）
     * @return *{有子类的属性: 对应的models};
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
     * 保存数据
     * @return {*}
     */
    save: async function (client) {
      return await CB.Object._deepSaveAsync(this, client);
    }

  });
  /**
   * 保存全部对象
   * @param list
   * @param client
   */
  CB.Object.saveAll = async function (list, client) {
    const savedModels = [];
    for(let model of list) {
      savedModels.push(await CB.Object._deepSaveAsync(model, client));
    }
    return savedModels;
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
      if (value instanceof CB.Object) {
        if(value.isChanged()) children.push(value);
      }else if(value instanceof CB.File) {
        if(!value.getUrl() && !value.id) files.push(value);
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
    const unsavedChildren = [];
    const unsavedFiles = [];
    CB.Object._deepFindUnsavedChildren(model, unsavedChildren, unsavedFiles);
    //保存所有模型到服务器
    for(let model of unsavedChildren) {
      const children = model.getChildren(); //获取第一层的子类集合（非深度）
      //***保存所有子类
      for(let key of Object.keys(children)) {
        const childs = children[key];
        if(childs.length > 0) {
          //存在子类时，先保存全部子类
          const savedChilds = [];
          for(child of childs) {
            if(!child.id || child.id && !(child instanceof CB.File)) {
              const saved = await CB.crud.save(child.className, child._toSaveOrigin(), client);
              if(saved) child.id = saved.objectId;
            }
            savedChilds.push(child);
          }
          //然后在保存父模型以及其包含的子类
          model.set(key, _.isArray(model.get(key)) ? savedChilds : savedChilds[0]);
        }
      }
      if(!model.id || model.id && !(model instanceof CB.File)) {
        const saved = await CB.crud.save(model.className, model._toSaveOrigin(), client);
        if(saved) model.id = saved.objectId;
      }
      saveRelations(model);
    }
    const saved = await CB.crud.save(model.className, model._toSaveOrigin(), client);
    if(saved) model.id = saved.objectId;
    saveRelations(model);
    //***保存所有relation
    function saveRelations(model) {
      const relations = model.get('__relations');
      if(!_.isArray(relations)) return;

    }
    throw new Error('error');
    return model;
  };


  //********************************其它
  //********************************
  //********************************
  /**
   * Returns the appropriate subclass for making new instances of the given
   * className string.
   * @private
   */
  CB.Object._getSubclass = function (className) {
    if(!_.isString(className)) throw new Error('CB.Object._getSubclass requires a string argument.');
    let ObjectClass = CB.Object._classMap[className];
    if(!ObjectClass) {
      ObjectClass = CB.Object.extend(className);
      CB.Object._classMap[className] = ObjectClass;
    }
    return ObjectClass;
  };

  /**
   * Creates an instance of a subclass of CB.Object for the given classname.
   * @private
   */
  CB.Object._create = function (className, attributes, options) {
    const ObjectClass = CB.Object._getSubclass(className);
    return new ObjectClass(attributes, options);
  };

  // Set up a map of className to class so that we can create new instances of
  // CB Objects from JSON automatically.
  CB.Object._classMap = {};

  CB.Object._extend = CB._extend;

  /**
   * Creates a new model with defined attributes,
   * It's the same with
   * <pre>
   *   new CB.Object(attributes, options);
   *  </pre>
   * @param {Object} attributes The initial set of data to store in the object.
   * @param {Object} options A set of Backbone-like options for creating the
   *     object.  The only option currently supported is "collection".
   * @return {CB.Object}
   */
  CB.Object['new'] = function (attributes, options) {
    return new CB.Object(attributes, options);
  };

  CB.Object.extend = function (className, protoProps, classProps) {
    // Handle the case with only two args.
    if(!_.isString(className)) {
      if (className && _.has(className, "className")) {
        return CB.Object.extend(className.className, className, protoProps);
      } else {
        throw new Error("CB.Object.extend's first argument should be the className.");
      }
    }
    // If someone tries to subclass "User", coerce it to the right type.
    if(className === "User") className = "_User";

    let NewClassObject = null;
    if(_.has(CB.Object._classMap, className)) {
      const OldClassObject = CB.Object._classMap[className];
      // This new subclass has been told to extend both from "this" and from
      // OldClassObject. This is multiple inheritance, which isn't supported.
      // For now, let's just pick one.
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
    // Extending a subclass should reuse the classname automatically.
    NewClassObject.extend = function (arg0) {
      if(_.isString(arg0) || arg0 && _.has(arg0, "className")) {
        return CB.Object.extend.apply(NewClassObject, arguments);
      }
      const newArguments = [className].concat(_.toArray(arguments));
      return CB.Object.extend.apply(NewClassObject, newArguments);
    };
    NewClassObject['new'] = function (attributes, options) {
      return new NewClassObject(attributes, options);
    };
    CB.Object._classMap[className] = NewClassObject;
    return NewClassObject;
  };

  // ES6 class syntax support
  Object.defineProperty(CB.Object.prototype, 'className', {
    get: function () {
      //console.log(this.constructor);
      const className = this._className || this.constructor.name;
      if(className === 'User') return '_User';
      if(className === 'File') return '_File';
      return className;
    }
  });

};
