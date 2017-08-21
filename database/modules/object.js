const _ = require('lodash');
const utils = require('./utils');
const RESERVED_KEYS = ['objectId', 'createdAt', 'updatedAt'];
const checkReservedKey = function checkReservedKey(key) {
  if (RESERVED_KEYS.indexOf(key) !== -1) {
    throw new Error('key[' + key + '] is reserved');
  }
};

module.exports = function (CB) {
  CB.Object = function (attributes, options) {
    if (_.isString(attributes)) return CB.Object._create.apply(this, arguments);
    attributes = attributes || {};
    if(attributes.constructor === this.constructor) attributes = attributes.toOrigin();
    this.parseDefaultDate(attributes);
    this._hasPoniterData = false;
    this.cid = _.uniqueId('c');
    this._previousAttributes = _.cloneDeep(this.set(attributes).attributes);
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
     * 克隆模型
     * @return {CB}
     */
    clone: function() {
      return new this.constructor(this.toOrigin());
    },
    /**
     * 是否已被修改
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
    set: function set(key, value) {
      if(!key) return this;
      let attrs = this.attributes || {};
      if (_.isObject(key)) {
        _.each(key, (value, key) => {
          checkReservedKey(key);
        });
        attrs = _.extend({}, this.attributes, key);
      } else {
        checkReservedKey(key);
        attrs[key] = CB._decode(value, key);
      }
      if(attrs.objectId) {
        this.id = attrs.objectId;
        delete attrs.objectId;
      }
      this.attributes = attrs;
      return this;
    },
    /**
     * 增量设置数据
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
     * 转化为json
     * @return {string}
     */
    toJSON: function () {
      const json = this._toFullJSON();
      delete json['__type'];
      delete json['className'];
      return json;
    },
    _toFullJSON: function () {
      const json = _.cloneDeep(this.attributes);
      _.each(json, function (val, key) {
        json[key] = CB._encode(val);
      });
      _.each(this._operations, function (val, key) {
        json[key] = val;
      });
      if (_.has(this, "id")) {
        json.objectId = this.id;
      }
      _(['createdAt', 'updatedAt']).each(function (key) {
        if (_.has(_this, key)) {
          const val = _this[key];
          json[key] = _.isDate(val) ? val.toJSON() : val;
        }
      });
      json.__type = "Object";
      json.className = this.className;
      return json;
    },
    /**
     * 转化为原始数据
     * @return {object}
     */
    toOrigin: function () {
      return _.extend({}, this.attributes, !_.isUndefined(this.id) ? {
        objectId: this.id
      } : {});
    },
    /**
     * 当前对象转为引用对象(无完整数据）
     * @private
     */
    toPointer: function () {
      return {
        __type: "Pointer",
        className: this.className,
        objectId: this.id
      };
    },



    /**
     * 保存数据
     * @return {*}
     */
    save: function () {
      const unsavedChildren = [];
      const unsavedFiles = [];
      CB.Object._findUnsavedChildren(this, unsavedChildren, unsavedFiles);
      if (unsavedChildren.length + unsavedFiles.length > 0) {
        return CB.Object._deepSaveAsync(this).then(() => {
          return this.save();
        });
      }

      return this;
    }

  });



  /**
   * 查找未保存的子对象
   * @param model
   * @param children
   * @param files
   * @private
   */
  CB.Object._findUnsavedChildren = function (model, children, files) {
    _.each(model.attributes, (value) => {
      if (value instanceof CB.Object) {
        if (model.isChanged()) children.push(value);
      }else if(value instanceof CB.File) {
        if (!value.url() && !value.id) files.push(value);
      }
    });
  };

  CB.Object._deepSaveAsync = function (model) {
    let unsavedChildren = [];
    let unsavedFiles = [];
    CB.Object._findUnsavedChildren(model, unsavedChildren, unsavedFiles);

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
    if (_.has(CB.Object._classMap, className)) {
      const OldClassObject = CB.Object._classMap[className];
      // This new subclass has been told to extend both from "this" and from
      // OldClassObject. This is multiple inheritance, which isn't supported.
      // For now, let's just pick one.
      if (protoProps || classProps) {
        NewClassObject = OldClassObject._extend(protoProps, classProps);
      } else {
        return OldClassObject;
      }
    } else {
      protoProps = protoProps || {};
      protoProps._className = className;
      NewClassObject = this._extend(protoProps, classProps);
    }
    // Extending a subclass should reuse the classname automatically.
    NewClassObject.extend = function (arg0) {
      if (_.isString(arg0) || arg0 && _.has(arg0, "className")) {
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
    get: function get() {
      const className = this._className || this.constructor.name;
      // If someone tries to subclass "User", coerce it to the right type.
      if (className === "User") {
        return "_User";
      }
      return className;
    }
  });

};
