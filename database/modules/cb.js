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

CB._mapObject = function(obj, iteratee, context) {
  iteratee = cb(iteratee, context);
  let keys =  _.keys(obj), length = keys.length, results = {}, currentKey;
  for (let index = 0; index < length; index++) {
    currentKey = keys[index];
    results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
  }
  function cb(value, context, argCount) {
    if (value === null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  }
  function optimizeCb(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount === null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  }
  return results;
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
 * Converts a value in a CB Object into the appropriate representation.
 * This is the JS equivalent of Java's CB.maybeReferenceAndEncode(Object)
 * if seenObjects is falsey. Otherwise any CB.Objects not in
 * seenObjects will be fully embedded rather than encoded
 * as a pointer.  This array will be used to prevent going into an infinite
 * loop because we have circular references.  If <seenObjects>
 * is set, then none of the CB Objects that are serialized can be dirty.
 * @private
 */
CB._encode = function (value, seenObjects, disallowObjects) {
  if (value instanceof CB.Object) {
    if (disallowObjects) {
      throw new Error("CB.Objects not allowed here");
    }
    if (!seenObjects || _.include(seenObjects, value) || !value._hasData) {
      return value._toPointer();
    }
    if (!value.isChanged()) {
      seenObjects = seenObjects.concat(value);
      return CB._encode(value._toFullJSON(seenObjects), seenObjects, disallowObjects);
    }
    throw new Error("Tried to save an object with a pointer to a new, unsaved object.");
  }
  if (_.isDate(value)) {
    return { "__type": "Date", "iso": value.toJSON() };
  }
  if (_.isArray(value)) {
    return _.map(value, function (x) {
      return CB._encode(x, seenObjects, disallowObjects);
    });
  }
  if (_.isRegExp(value)) {
    return value.source;
  }
  if (value instanceof CB.Relation) {
    return value.toJSON();
  }
  if (value instanceof CB.File) {
    if (!value.url() && !value.id) {
      throw new Error("Tried to save an object containing an unsaved file.");
    }
    return value._toFullJSON();
  }
  if (_.isObject(value)) {
    return CB._mapObject(value, function (value) {
      return CB._encode(value, seenObjects, disallowObjects);
    });
  }
  return value;
};

/**
 * The inverse function of CB._encode.
 * @private
 */
CB._decode = function (value, key) {
  if (!_.isObject(value) || _.isDate(value)) {
    return value;
  }
  if (_.isArray(value)) {
    return _.map(value, function (v) {
      return CB._decode(v);
    });
  }
  if (value instanceof CB.Object) {
    return value;
  }
  if (value instanceof CB.File) {
    return value;
  }
  let className;
  if (value.__type === "Pointer") {
    className = value.className;
    const pointer = CB.Object._create(className, undefined, undefined, /* noDefaultACL*/true);
    if (_.keys(value).length > 3) {
      const v = _.clone(value);
      delete v.__type;
      delete v.className;
      pointer._finishFetch(v, true);
    } else {
      pointer._finishFetch({ objectId: value.objectId }, false);
    }
    return pointer;
  }
  if (value.__type === "Object") {
    // It's an Object included in a query result.
    className = value.className;
    const _v = _.clone(value);
    delete _v.__type;
    delete _v.className;
    const object = CB.Object._create(className, undefined, undefined, /* noDefaultACL*/true);
    object._finishFetch(_v, true);
    return object;
  }
  if (value.__type === "Date") {
    return CB._parseDate(value.iso);
  }
  if (value.__type === "Relation") {
    if (!key) throw new Error('key missing decoding a Relation');
    const relation = new CB.Relation(null, key);
    relation.targetClassName = value.className;
    return relation;
  }
  if (value.__type === 'File') {
    const file = new CB.File(value.name);
    const _v2 = _.clone(value);
    delete _v2.__type;
    file._finishFetch(_v2);
    return file;
  }
  return CB._mapObject(value, CB._decode);
};

CB._encodeObjectOrArray = function (value) {
  function encodeCBObject(object) {
    if (object && object._toFullJSON) {
      object = object._toFullJSON([]);
    }

    return CB._mapObject(object, function (value) {
      return CB._encode(value, []);
    });
  }

  if (_.isArray(value)) {
    return value.map(function (object) {
      return encodeCBObject(object);
    });
  } else {
    return encodeCBObject(value);
  }
};


module.exports = CB;
