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

CB._parseDate = function (dataString) {
  return moment(dataString).format('YYYY-MM-DD HH:mm:ss');
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

/**
 * 转化普通对象为CBObject
 */
CB._encode = function (object) {
  if(object instanceof CB.Object) {
    if(!object._hasPoniterData) {
      return object.toPointer();
    }
    if(!object.isChanged()) {
      seenObjects = seenObjects.concat(object);
      return CB._encode(object._toFullJSON(seenObjects), seenObjects, disallowObjects);
    }
    throw new Error("Tried to save an object with a pointer to a new, unsaved object.");
  }
  if (_.isDate(object)) {
    return { "__type": "Date", "iso": object.toJSON() };
  }
  if (_.isArray(object)) {
    return _.map(object, function (x) {
      return CB._encode(x, seenObjects, disallowObjects);
    });
  }
  if (_.isRegExp(object)) {
    return object.source;
  }
  if (object instanceof CB.Relation) {
    return object.toJSON();
  }
  if (object instanceof CB.File) {
    if (!object.url() && !object.id) {
      throw new Error("Tried to save an object containing an unsaved file.");
    }
    return object._toFullJSON();
  }
  if (_.isObject(object)) {
    return _.mapValues(object, function (object) {
      return CB._encode(object, seenObjects, disallowObjects);
    });
  }
  return object;
};
CB._encodeObjectOrArray = function (object) {
  function encodeCBObject(object) {
    if (object && object._toFullJSON) {
      object = object._toFullJSON([]);
    }

    return _.mapValues(object, function (object) {
      return CB._encode(object, []);
    });
  }

  if (_.isArray(object)) {
    return object.map(function (object) {
      return encodeCBObject(object);
    });
  } else {
    return encodeCBObject(object);
  }
};

/**
 * 解析对象
 * @param object
 * @param key
 * @return {*}
 * @private
 */
CB._decode = function (object, key) {
  if(!_.isObject(object) || _.isDate(object)) return object;
  if(_.isArray(object)) {
    return _.map(object, function (child) {
      return CB._decode(child);
    });
  }
  if(object instanceof CB.Object) return object;
  if(object instanceof CB.File) return object;
  if(object.__type === 'Pointer') {
    const pointer = CB.Object._create(object.className);
    pointer._hasPoniterData = _.keys(object).length > 3;
    return pointer;
  }
  if(object.__type === 'Relation') {
    if(!key) throw new Error('key missing decoding a Relation');
    const relation = new CB.Relation(null, key);
    relation.targetClassName = object.className;
    return relation;
  }
  if(object.__type === 'File') {
    return new CB.File(object.name);
  }
  return _.mapValues(object, CB._decode);
};




module.exports = CB;
