const _ = require('lodash');
const moment = require('moment');
const CB = global.CB || {};

// Shared empty constructor function to aid in prototype-chain creation.
const EmptyConstructor = function EmptyConstructor() {};

// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
const inherits = function (parent, protoProps, staticProps) {
  let child;
  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent's constructor.
  if (protoProps && protoProps.hasOwnProperty('constructor')) {
    child = protoProps.constructor;
  } else {
    /** @ignore */
    child = function child() {
      parent.apply(this, arguments);
    };
  }
  // Inherit class (static) properties from parent.
  Object.assign(child, parent);
  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  EmptyConstructor.prototype = parent.prototype;
  child.prototype = new EmptyConstructor();
  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) {
    Object.assign(child.prototype, protoProps);
  }
  // Add static properties to the constructor function, if supplied.
  if (staticProps) {
    Object.assign(child, staticProps);
  }
  // Correctly set child's `prototype.constructor`.
  child.prototype.constructor = child;
  // Set a convenience property in case the parent's prototype is
  // needed later.
  child.__super__ = parent.prototype;
  return child;
};

CB._parseDate = function (date) {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Helper function to get a value from a Backbone object as a property
// or as a function.
CB._getValue = function (object, prop) {
  if (!(object && object[prop])) {
    return null;
  }
  return _.isFunction(object[prop]) ? object[prop]() : object[prop];
};

// A self-propagating extend function.
CB._extend = function (protoProps, classProps) {
  const child = inherits(this, protoProps, classProps);
  child.extend = this.extend;
  return child;
};

// 深度遍历CBObject属性
CB._traverse = function (object, cb) {
  if(object instanceof CB.Object) {
    CB._traverse(object.attributes, cb);
    return cb(object);
  }
  if(object instanceof CB.Relation || object instanceof CB.File) {
    return cb(object);
  }
  if(_.isArray(object)) {
    _.each(object, function (child, index) {
      const newChild = CB._traverse(child, cb);
      if (newChild) object[index] = newChild;
    });
    return cb(object);
  }
  if(_.isObject(object)) {
    _.each(object, function (child, key) {
      const newChild = CB._traverse(child, cb);
      if (newChild) object[key] = newChild;
    });
    return cb(object);
  }
  return cb(object);
};

/**
 * 编码对象（普通对象 -> CBObject）
 * @param object
 * @return {*}
 * @private
 */
CB._encode = function (object) {
  if(!_.isObject(object) || _.isDate(object)) return object;
  if(_.isArray(object)) return object.map(child => CB._encode(child));
  if(object instanceof CB.Object) return object;
  if(object instanceof CB.File) return object;
  if(object instanceof CB.Relation) return object;
  if(object.__type === 'Pointer') {
    let pointer;
    if(_.size(object) > 3) {
      pointer = new CB.Object(object);
    }else {
      pointer = new CB.Object(
        {__type: object.__type, className: object.className, objectId: object.objectId},
        {hasData: false}
      );
    }
    return pointer;
  }
  if(object.__type === 'Relation') {
    if(!object.key) throw new Error('key missing encoding a Relation');
    return new CB.Relation(object.className, object.relationId, object.key);
  }
  if(object.__type === 'File') {
    const file = new CB.File(object.name);
    file.set(object);
    return file;
  }
  return _.mapValues(object, CB._encode);
};

/**
 * 解析对象（CBObject || CBFile 转化为 普通对象）
 * @param object  CBObject
 * @param hiddenFields 需要屏蔽删除敏感字段
 * @return {*}
 * @private
 */
CB._decode = function (object, hiddenFields = []) {
  if(_.isDate(object)) return CB._parseDate(object);
  if(_.isArray(object)) return _.map(object, child => CB._decode(child, hiddenFields));
  if(object instanceof CB.Object || object instanceof CB.File) {
    const origin = Object.assign(object.getPointer(), object.attributes);
    origin.className = origin.className.split('@_@')[0];
    delete origin.objectId;
    if(object.id) origin.objectId = object.id;
    if(object.createdAt) origin.createdAt = object.createdAt;
    if(object.updatedAt) origin.updatedAt = object.updatedAt;
    hiddenFields.forEach(key => {
      delete origin[key];
    });
    return CB._decode(origin, hiddenFields);
  }
  if(object instanceof CB.Relation) return object.getPointer();
  if(_.isObject(object)) return _.mapValues(object, value => CB._decode(value, hiddenFields));
  return object;
};

module.exports = CB;
