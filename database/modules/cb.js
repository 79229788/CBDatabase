const _ = require('lodash');
const moment = require('moment');
const CB = global.CB || {};

// Shared empty constructor function to aid in prototype-chain creation.
const EmptyConstructor = function EmptyConstructor() {};

// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
const inherits = function inherits(parent, protoProps, staticProps) {
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
  _.extend(child, parent);
  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function.
  EmptyConstructor.prototype = parent.prototype;
  child.prototype = new EmptyConstructor();
  // Add prototype properties (instance properties) to the subclass,
  // if supplied.
  if (protoProps) {
    _.extend(child.prototype, protoProps);
  }
  // Add static properties to the constructor function, if supplied.
  if (staticProps) {
    _.extend(child, staticProps);
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
CB._traverse = function (object, func) {
  if(object instanceof CB.Object) {
    CB._traverse(object.attributes, func);
    return func(object);
  }
  if(object instanceof CB.Relation || object instanceof CB.File) {
    return func(object);
  }
  if(_.isArray(object)) {
    _.each(object, function (child, index) {
      const newChild = CB._traverse(child, func);
      if (newChild) object[index] = newChild;
    });
    return func(object);
  }
  if(_.isObject(object)) {
    _.each(object, function (child, key) {
      const newChild = key === '__relations' ? child : CB._traverse(child, func);
      if (newChild) object[key] = newChild;
    });
    return func(object);
  }
  return func(object);
};

/**
 * 编码对象（普通对象 -> CBObject）
 * @param object
 * @param key
 * @return {*}
 * @private
 */
CB._encode = function (object, key) {
  if(!_.isObject(object) || _.isDate(object)) return object;
  if(_.isArray(object)) return object.map(child => CB._encode(child));
  if(object instanceof CB.Object) return object;
  if(object instanceof CB.File) return object;
  if(object instanceof CB.Relation) return object;
  if(object.__type === 'Pointer') {
    let pointer;
    if(_.size(object) > 3) {
      pointer = new CB.Object(object, {serverData: true});
      pointer._hasData = true;
    }else {
      pointer = CB.Object._create(object.className);
      pointer.id = object.objectId;
      pointer._hasData = false;
    }
    return pointer;
  }
  if(object.__type === 'Relation') {
    if(!key) throw new Error('key missing encoding a Relation');
    const relation = new CB.Relation(null, key);
    relation.className = object.className;
    relation.relationId = object.relationId;
    return relation;
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
 * @return {*}
 * @private
 */
CB._decode = function (object) {
  if(_.isDate(object)) return CB._parseDate(object);
  if(_.isArray(object)) {
    return _.map(object, child => CB._decode(child));
  }
  if(object instanceof CB.Object || object instanceof CB.File) {
    const origin = _.extend(object.getPointer(), object.attributes);
    if(object.id) {
      origin.objectId = object.id;
    }else {
      delete origin.objectId;
    }
    //删除敏感字段（自定义字段请不要与其冲突，否则一并删除）
    delete origin.password;
    delete origin.authData;
    return CB._decode(origin);
  }
  if(object instanceof CB.Relation) return object.toOrigin();
  if(_.isObject(object)) {
    return _.mapValues(object, value => CB._decode(value));
  }
  return object;
};

module.exports = CB;
