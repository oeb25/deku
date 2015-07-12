!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.deku=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof _require=="function"&&_require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof _require=="function"&&_require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_require,module,exports){
/**
 * Expose `requestAnimationFrame()`.
 */

exports = module.exports = window.requestAnimationFrame
  || window.webkitRequestAnimationFrame
  || window.mozRequestAnimationFrame
  || fallback;

/**
 * Fallback implementation.
 */

var prev = new Date().getTime();
function fallback(fn) {
  var curr = new Date().getTime();
  var ms = Math.max(0, 16 - (curr - prev));
  var req = setTimeout(fn, ms);
  prev = curr;
  return req;
}

/**
 * Cancel.
 */

var cancel = window.cancelAnimationFrame
  || window.webkitCancelAnimationFrame
  || window.mozCancelAnimationFrame
  || window.clearTimeout;

exports.cancel = function(id){
  cancel.call(window, id);
};

},{}],2:[function(_require,module,exports){
/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object Error]': return 'error';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val !== val) return 'nan';
  if (val && val.nodeType === 1) return 'element';

  val = val.valueOf
    ? val.valueOf()
    : Object.prototype.valueOf.apply(val)

  return typeof val;
};

},{}],3:[function(_require,module,exports){
var slice = Array.prototype.slice;
var toArray = function(a){ return slice.call(a) }
var tail = function(a){ return slice.call(a, 1) }

// fn, [value] -> fn
//-- create a curried function, incorporating any number of
//-- pre-existing arguments (e.g. if you're further currying a function).
var createFn = function(fn, args, totalArity){
    var remainingArity = totalArity - args.length;

    switch (remainingArity) {
        case 0: return function(){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 1: return function(a){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 2: return function(a,b){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 3: return function(a,b,c){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 4: return function(a,b,c,d){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 5: return function(a,b,c,d,e){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 6: return function(a,b,c,d,e,f){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 7: return function(a,b,c,d,e,f,g){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 8: return function(a,b,c,d,e,f,g,h){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 9: return function(a,b,c,d,e,f,g,h,i){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        case 10: return function(a,b,c,d,e,f,g,h,i,j){ return processInvocation(fn, concatArgs(args, arguments), totalArity) };
        default: return createEvalFn(fn, args, remainingArity);
    }
}

// [value], arguments -> [value]
//-- concat new arguments onto old arguments array
var concatArgs = function(args1, args2){
    return args1.concat(toArray(args2));
}

// fn, [value], int -> fn
//-- create a function of the correct arity by the use of eval,
//-- so that curry can handle functions of any arity
var createEvalFn = function(fn, args, arity){
    var argList = makeArgList(arity);

    //-- hack for IE's faulty eval parsing -- http://stackoverflow.com/a/6807726
    var fnStr = 'false||' +
                'function(' + argList + '){ return processInvocation(fn, concatArgs(args, arguments)); }';
    return eval(fnStr);
}

var makeArgList = function(len){
    var a = [];
    for ( var i = 0; i < len; i += 1 ) a.push('a' + i.toString());
    return a.join(',');
}

var trimArrLength = function(arr, length){
    if ( arr.length > length ) return arr.slice(0, length);
    else return arr;
}

// fn, [value] -> value
//-- handle a function being invoked.
//-- if the arg list is long enough, the function will be called
//-- otherwise, a new curried version is created.
var processInvocation = function(fn, argsArr, totalArity){
    argsArr = trimArrLength(argsArr, totalArity);

    if ( argsArr.length === totalArity ) return fn.apply(null, argsArr);
    return createFn(fn, argsArr, totalArity);
}

// fn -> fn
//-- curries a function! <3
var curry = function(fn){
    return createFn(fn, [], fn.length);
}

// num, fn -> fn
//-- curries a function to a certain arity! <33
curry.to = curry(function(arity, fn){
    return createFn(fn, [], arity);
});

// num, fn -> fn
//-- adapts a function in the context-first style
//-- to a curried version. <3333
curry.adaptTo = curry(function(num, fn){
    return curry.to(num, function(context){
        var args = tail(arguments).concat(context);
        return fn.apply(this, args);
    });
})

// fn -> fn
//-- adapts a function in the context-first style to
//-- a curried version. <333
curry.adapt = function(fn){
    return curry.adaptTo(fn.length, fn)
}


module.exports = curry;

},{}],4:[function(_require,module,exports){
/**
 * Dependencies
 */

var isArray = Array.isArray

/**
 * Initialize `EzMap`.
 *
 * @constructor
 * @param {array} [arr]
 *
 * @api public
 */

function EzMap(arr) {
  this._keys   = []
  this._values = []
  if (isArray(arr) && arr.length)
    this._initial(arr)
}

/**
 * Set initial entries.
 *
 * @param  {array} arr
 * @return {void}
 *
 * @api private
 */

EzMap.prototype._initial = function(arr) {
  var self = this
  arr.forEach(function(entry) {
    var key   = entry[0]
    var value = entry[1]
    self._keys.push(key)
    self._values.push(value)
  })
}

/**
 * Get the index of `key`.
 *
 * @param  {mixed} key
 * @return {number}
 *
 * @api private
 */

EzMap.prototype._index = function(key) {
  return this._keys.indexOf(key)
}

/**
 * Set an entry.
 *
 * @param  {mixed} key
 * @param  {mixed} [value]
 * @return {this}
 *
 * @api public
 */

EzMap.prototype.set = function(key, value) {
  var index = this._index(key)
  if (index < 0) index = this._keys.length
  this._keys[index]   = key
  this._values[index] = value
  return this
}

/**
 * Check if `key` is an entry.
 *
 * @param  {mixed} key
 * @return {boolean}
 *
 * @api public
 */

EzMap.prototype.has = function(key) {
  return this._index(key) >= 0
}

/**
 * Get an entry.
 *
 * @param  {mixed} key
 * @return {mixed}
 *
 * @api public
 */

EzMap.prototype.get = function(key) {
  var index = this._index(key)
  if (index >= 0) return this._values[index]
}

/**
 * Get the keys of all entries.
 *
 * @return {array}
 *
 * @api public
 */

EzMap.prototype.keys = function() {
  return this._keys
}

/**
 * Get the values of all entries.
 *
 * @return {array}
 *
 * @api public
 */

EzMap.prototype.values = function() {
  return this._values
}

/**
 * Get all entries.
 *
 * @return {array}
 *
 * @api public
 */

EzMap.prototype.entries = function() {
  var keys    = this._keys
  var values  = this._values
  var entries = []
  keys.forEach(function(_, index) {
    entries.push([keys[index], values[index]])
  })
  return entries
}

/**
 * Get the size of all entries.
 *
 * @return {number}
 *
 * @api public
 */

EzMap.prototype.size = function() {
  return this.entries().length
}

/**
 * Iterate over all entries with `iterator`.
 *
 * @param  {function} iterator
 * @return {void}
 *
 * @api public
 */

EzMap.prototype.forEach = function(iterator) {
  var entries = this.entries()
  var context = this
  entries.forEach(function(entry) {
    var key   = entry[0]
    var value = entry[1]
    iterator(value, key, context)
  })
}

/**
 * Delete an entry.
 *
 * @param  {mixed} key
 * @return {boolean}
 *
 * @api public
 */

EzMap.prototype['delete'] = function(key) {
  var index = this._index(key)
  if (index >= 0) {
    this._keys.splice(index, 1)
    this._values.splice(index, 1)
    return true
  }
  return false
}

/**
 * Clear all entries.
 *
 * @return {void}
 *
 * @api public
 */

EzMap.prototype.clear = function() {
  this._keys.length   = 0
  this._values.length = 0
}

/**
 * Exports
 */

module.exports = EzMap

},{}],5:[function(_require,module,exports){
'use strict';

var bindInternal3 = _require('../function/bindInternal3');

/**
 * # For Each
 *
 * A fast `.forEach()` implementation.
 *
 * @param  {Array}    subject     The array (or array-like) to iterate over.
 * @param  {Function} fn          The visitor function.
 * @param  {Object}   thisContext The context for the visitor.
 */
module.exports = function fastForEach (subject, fn, thisContext) {
  var length = subject.length,
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      i;
  for (i = 0; i < length; i++) {
    iterator(subject[i], i, subject);
  }
};

},{"../function/bindInternal3":9}],6:[function(_require,module,exports){
'use strict';

/**
 * # Index Of
 *
 * A faster `Array.prototype.indexOf()` implementation.
 *
 * @param  {Array}  subject   The array (or array-like) to search within.
 * @param  {mixed}  target    The target item to search for.
 * @param  {Number} fromIndex The position to start searching from, if known.
 * @return {Number}           The position of the target in the subject, or -1 if it does not exist.
 */
module.exports = function fastIndexOf (subject, target, fromIndex) {
  var length = subject.length,
      i = 0;

  if (typeof fromIndex === 'number') {
    i = fromIndex;
    if (i < 0) {
      i += length;
      if (i < 0) {
        i = 0;
      }
    }
  }

  for (; i < length; i++) {
    if (subject[i] === target) {
      return i;
    }
  }
  return -1;
};

},{}],7:[function(_require,module,exports){
'use strict';

var bindInternal4 = _require('../function/bindInternal4');

/**
 * # Reduce
 *
 * A fast `.reduce()` implementation.
 *
 * @param  {Array}    subject      The array (or array-like) to reduce.
 * @param  {Function} fn           The reducer function.
 * @param  {mixed}    initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}   thisContext  The context for the reducer.
 * @return {mixed}                 The final result.
 */
module.exports = function fastReduce (subject, fn, initialValue, thisContext) {
  var length = subject.length,
      iterator = thisContext !== undefined ? bindInternal4(fn, thisContext) : fn,
      i, result;

  if (initialValue === undefined) {
    i = 1;
    result = subject[0];
  }
  else {
    i = 0;
    result = initialValue;
  }

  for (; i < length; i++) {
    result = iterator(result, subject[i], i, subject);
  }

  return result;
};

},{"../function/bindInternal4":10}],8:[function(_require,module,exports){
'use strict';

var forEachArray = _require('./array/forEach'),
    forEachObject = _require('./object/forEach');

/**
 * # ForEach
 *
 * A fast `.forEach()` implementation.
 *
 * @param  {Array|Object} subject     The array or object to iterate over.
 * @param  {Function}     fn          The visitor function.
 * @param  {Object}       thisContext The context for the visitor.
 */
module.exports = function fastForEach (subject, fn, thisContext) {
  if (subject instanceof Array) {
    return forEachArray(subject, fn, thisContext);
  }
  else {
    return forEachObject(subject, fn, thisContext);
  }
};
},{"./array/forEach":5,"./object/forEach":12}],9:[function(_require,module,exports){
'use strict';

/**
 * Internal helper to bind a function known to have 3 arguments
 * to a given context.
 */
module.exports = function bindInternal3 (func, thisContext) {
  return function (a, b, c) {
    return func.call(thisContext, a, b, c);
  };
};

},{}],10:[function(_require,module,exports){
'use strict';

/**
 * Internal helper to bind a function known to have 4 arguments
 * to a given context.
 */
module.exports = function bindInternal4 (func, thisContext) {
  return function (a, b, c, d) {
    return func.call(thisContext, a, b, c, d);
  };
};

},{}],11:[function(_require,module,exports){
'use strict';

/**
 * Analogue of Object.assign().
 * Copies properties from one or more source objects to
 * a target object. Existing keys on the target object will be overwritten.
 *
 * > Note: This differs from spec in some important ways:
 * > 1. Will throw if passed non-objects, including `undefined` or `null` values.
 * > 2. Does not support the curious Exception handling behavior, exceptions are thrown immediately.
 * > For more details, see:
 * > https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 *
 *
 *
 * @param  {Object} target      The target object to copy properties to.
 * @param  {Object} source, ... The source(s) to copy properties from.
 * @return {Object}             The updated target object.
 */
module.exports = function fastAssign (target) {
  var totalArgs = arguments.length,
      source, i, totalKeys, keys, key, j;

  for (i = 1; i < totalArgs; i++) {
    source = arguments[i];
    keys = Object.keys(source);
    totalKeys = keys.length;
    for (j = 0; j < totalKeys; j++) {
      key = keys[j];
      target[key] = source[key];
    }
  }
  return target;
};

},{}],12:[function(_require,module,exports){
'use strict';

var bindInternal3 = _require('../function/bindInternal3');

/**
 * # For Each
 *
 * A fast object `.forEach()` implementation.
 *
 * @param  {Object}   subject     The object to iterate over.
 * @param  {Function} fn          The visitor function.
 * @param  {Object}   thisContext The context for the visitor.
 */
module.exports = function fastForEachObject (subject, fn, thisContext) {
  var keys = Object.keys(subject),
      length = keys.length,
      iterator = thisContext !== undefined ? bindInternal3(fn, thisContext) : fn,
      key, i;
  for (i = 0; i < length; i++) {
    key = keys[i];
    iterator(subject[key], key, subject);
  }
};

},{"../function/bindInternal3":9}],13:[function(_require,module,exports){
'use strict';

var bindInternal4 = _require('../function/bindInternal4');

/**
 * # Reduce
 *
 * A fast object `.reduce()` implementation.
 *
 * @param  {Object}   subject      The object to reduce over.
 * @param  {Function} fn           The reducer function.
 * @param  {mixed}    initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}   thisContext  The context for the reducer.
 * @return {mixed}                 The final result.
 */
module.exports = function fastReduceObject (subject, fn, initialValue, thisContext) {
  var keys = Object.keys(subject),
      length = keys.length,
      iterator = thisContext !== undefined ? bindInternal4(fn, thisContext) : fn,
      i, key, result;

  if (initialValue === undefined) {
    i = 1;
    result = subject[keys[0]];
  }
  else {
    i = 0;
    result = initialValue;
  }

  for (; i < length; i++) {
    key = keys[i];
    result = iterator(result, subject[key], key, subject);
  }

  return result;
};

},{"../function/bindInternal4":10}],14:[function(_require,module,exports){
'use strict';

var reduceArray = _require('./array/reduce'),
    reduceObject = _require('./object/reduce');

/**
 * # Reduce
 *
 * A fast `.reduce()` implementation.
 *
 * @param  {Array|Object} subject      The array or object to reduce over.
 * @param  {Function}     fn           The reducer function.
 * @param  {mixed}        initialValue The initial value for the reducer, defaults to subject[0].
 * @param  {Object}       thisContext  The context for the reducer.
 * @return {Array|Object}              The array or object containing the results.
 */
module.exports = function fastReduce (subject, fn, initialValue, thisContext) {
  if (subject instanceof Array) {
    return reduceArray(subject, fn, initialValue, thisContext);
  }
  else {
    return reduceObject(subject, fn, initialValue, thisContext);
  }
};
},{"./array/reduce":7,"./object/reduce":13}],15:[function(_require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],16:[function(_require,module,exports){
/*global window*/

/**
 * Check if object is dom node.
 *
 * @param {Object} val
 * @return {Boolean}
 * @api public
 */

module.exports = function isNode(val){
  if (!val || typeof val !== 'object') return false;
  if (window && 'object' == typeof window.Node) return val instanceof window.Node;
  return 'number' == typeof val.nodeType && 'string' == typeof val.nodeName;
}

},{}],17:[function(_require,module,exports){

/**
 * Expose `isEmpty`.
 */

module.exports = isEmpty;


/**
 * Has.
 */

var has = Object.prototype.hasOwnProperty;


/**
 * Test whether a value is "empty".
 *
 * @param {Mixed} val
 * @return {Boolean}
 */

function isEmpty (val) {
  if (null == val) return true;
  if ('number' == typeof val) return 0 === val;
  if (undefined !== val.length) return 0 === val.length;
  for (var key in val) if (has.call(val, key)) return false;
  return true;
}
},{}],18:[function(_require,module,exports){
module.exports = isPromise;

function isPromise(obj) {
  return obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

},{}],19:[function(_require,module,exports){
/**
 * Supported SVG attributes
 */

exports.attributes = {
  'cx': true,
  'cy': true,
  'd': true,
  'dx': true,
  'dy': true,
  'fill': true,
  'fillOpacity': true,
  'fontFamily': true,
  'fontSize': true,
  'fx': true,
  'fy': true,
  'gradientTransform': true,
  'gradientUnits': true,
  'markerEnd': true,
  'markerMid': true,
  'markerStart': true,
  'offset': true,
  'opacity': true,
  'patternContentUnits': true,
  'patternUnits': true,
  'points': true,
  'preserveAspectRatio': true,
  'r': true,
  'rx': true,
  'ry': true,
  'spreadMethod': true,
  'stopColor': true,
  'stopOpacity': true,
  'stroke': true,
  'strokeDasharray': true,
  'strokeLinecap': true,
  'strokeOpacity': true,
  'strokeWidth': true,
  'textAnchor': true,
  'transform': true,
  'version': true,
  'viewBox': true,
  'x1': true,
  'x2': true,
  'x': true,
  'y1': true,
  'y2': true,
  'y': true
}

/**
 * Are element's attributes SVG?
 *
 * @param {String} attr
 */

module.exports = function (attr) {
  return attr in exports.attributes
}

},{}],20:[function(_require,module,exports){
'use strict'

module.exports = function(target) {
  target = target || {}

  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i]
    if (!source) continue

    Object.getOwnPropertyNames(source).forEach(function(key) {
      if (undefined === target[key])
        target[key] = source[key]
    })
  }

  return target
}

},{}],21:[function(_require,module,exports){
(function (root, factory){
  'use strict';

  /*istanbul ignore next:cant test*/
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else {
    // Browser globals
    root.objectPath = factory();
  }
})(this, function(){
  'use strict';

  var
    toStr = Object.prototype.toString,
    _hasOwnProperty = Object.prototype.hasOwnProperty;

  function isEmpty(value){
    if (!value) {
      return true;
    }
    if (isArray(value) && value.length === 0) {
      return true;
    } else {
      for (var i in value) {
        if (_hasOwnProperty.call(value, i)) {
          return false;
        }
      }
      return true;
    }
  }

  function toString(type){
    return toStr.call(type);
  }

  function isNumber(value){
    return typeof value === 'number' || toString(value) === "[object Number]";
  }

  function isString(obj){
    return typeof obj === 'string' || toString(obj) === "[object String]";
  }

  function isObject(obj){
    return typeof obj === 'object' && toString(obj) === "[object Object]";
  }

  function isArray(obj){
    return typeof obj === 'object' && typeof obj.length === 'number' && toString(obj) === '[object Array]';
  }

  function isBoolean(obj){
    return typeof obj === 'boolean' || toString(obj) === '[object Boolean]';
  }

  function getKey(key){
    var intKey = parseInt(key);
    if (intKey.toString() === key) {
      return intKey;
    }
    return key;
  }

  function set(obj, path, value, doNotReplace){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isString(path)) {
      return set(obj, path.split('.').map(getKey), value, doNotReplace);
    }
    var currentPath = path[0];

    if (path.length === 1) {
      var oldVal = obj[currentPath];
      if (oldVal === void 0 || !doNotReplace) {
        obj[currentPath] = value;
      }
      return oldVal;
    }

    if (obj[currentPath] === void 0) {
      //check if we assume an array
      if(isNumber(path[1])) {
        obj[currentPath] = [];
      } else {
        obj[currentPath] = {};
      }
    }

    return set(obj[currentPath], path.slice(1), value, doNotReplace);
  }

  function del(obj, path) {
    if (isNumber(path)) {
      path = [path];
    }

    if (isEmpty(obj)) {
      return void 0;
    }

    if (isEmpty(path)) {
      return obj;
    }
    if(isString(path)) {
      return del(obj, path.split('.'));
    }

    var currentPath = getKey(path[0]);
    var oldVal = obj[currentPath];

    if(path.length === 1) {
      if (oldVal !== void 0) {
        if (isArray(obj)) {
          obj.splice(currentPath, 1);
        } else {
          delete obj[currentPath];
        }
      }
    } else {
      if (obj[currentPath] !== void 0) {
        return del(obj[currentPath], path.slice(1));
      }
    }

    return obj;
  }

  var objectPath = {};

  objectPath.has = function (obj, path) {
    if (isEmpty(obj)) {
      return false;
    }

    if (isNumber(path)) {
      path = [path];
    } else if (isString(path)) {
      path = path.split('.');
    }

    if (isEmpty(path) || path.length === 0) {
      return false;
    }

    for (var i = 0; i < path.length; i++) {
      var j = path[i];
      if ((isObject(obj) || isArray(obj)) && _hasOwnProperty.call(obj, j)) {
        obj = obj[j];
      } else {
        return false;
      }
    }

    return true;
  };

  objectPath.ensureExists = function (obj, path, value){
    return set(obj, path, value, true);
  };

  objectPath.set = function (obj, path, value, doNotReplace){
    return set(obj, path, value, doNotReplace);
  };

  objectPath.insert = function (obj, path, value, at){
    var arr = objectPath.get(obj, path);
    at = ~~at;
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }
    arr.splice(at, 0, value);
  };

  objectPath.empty = function(obj, path) {
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return void 0;
    }

    var value, i;
    if (!(value = objectPath.get(obj, path))) {
      return obj;
    }

    if (isString(value)) {
      return objectPath.set(obj, path, '');
    } else if (isBoolean(value)) {
      return objectPath.set(obj, path, false);
    } else if (isNumber(value)) {
      return objectPath.set(obj, path, 0);
    } else if (isArray(value)) {
      value.length = 0;
    } else if (isObject(value)) {
      for (i in value) {
        if (_hasOwnProperty.call(value, i)) {
          delete value[i];
        }
      }
    } else {
      return objectPath.set(obj, path, null);
    }
  };

  objectPath.push = function (obj, path /*, values */){
    var arr = objectPath.get(obj, path);
    if (!isArray(arr)) {
      arr = [];
      objectPath.set(obj, path, arr);
    }

    arr.push.apply(arr, Array.prototype.slice.call(arguments, 2));
  };

  objectPath.coalesce = function (obj, paths, defaultValue) {
    var value;

    for (var i = 0, len = paths.length; i < len; i++) {
      if ((value = objectPath.get(obj, paths[i])) !== void 0) {
        return value;
      }
    }

    return defaultValue;
  };

  objectPath.get = function (obj, path, defaultValue){
    if (isNumber(path)) {
      path = [path];
    }
    if (isEmpty(path)) {
      return obj;
    }
    if (isEmpty(obj)) {
      return defaultValue;
    }
    if (isString(path)) {
      return objectPath.get(obj, path.split('.'), defaultValue);
    }

    var currentPath = getKey(path[0]);

    if (path.length === 1) {
      if (obj[currentPath] === void 0) {
        return defaultValue;
      }
      return obj[currentPath];
    }

    return objectPath.get(obj[currentPath], path.slice(1), defaultValue);
  };

  objectPath.del = function(obj, path) {
    return del(obj, path);
  };

  return objectPath;
});

},{}],22:[function(_require,module,exports){
var _curry2 = _require('./internal/_curry2');


/**
 * Wraps a function of any arity (including nullary) in a function that accepts exactly `n`
 * parameters. Unlike `nAry`, which passes only `n` arguments to the wrapped function,
 * functions produced by `arity` will pass all provided arguments to the wrapped function.
 *
 * @func
 * @memberOf R
 * @sig (Number, (* -> *)) -> (* -> *)
 * @category Function
 * @param {Number} n The desired arity of the returned function.
 * @param {Function} fn The function to wrap.
 * @return {Function} A new function wrapping `fn`. The new function is
 *         guaranteed to be of arity `n`.
 * @deprecated since v0.15.0
 * @example
 *
 *      var takesTwoArgs = function(a, b) {
 *        return [a, b];
 *      };
 *      takesTwoArgs.length; //=> 2
 *      takesTwoArgs(1, 2); //=> [1, 2]
 *
 *      var takesOneArg = R.arity(1, takesTwoArgs);
 *      takesOneArg.length; //=> 1
 *      // All arguments are passed through to the wrapped function
 *      takesOneArg(1, 2); //=> [1, 2]
 */
module.exports = _curry2(function(n, fn) {
  // jshint unused:vars
  switch (n) {
    case 0: return function() {return fn.apply(this, arguments);};
    case 1: return function(a0) {return fn.apply(this, arguments);};
    case 2: return function(a0, a1) {return fn.apply(this, arguments);};
    case 3: return function(a0, a1, a2) {return fn.apply(this, arguments);};
    case 4: return function(a0, a1, a2, a3) {return fn.apply(this, arguments);};
    case 5: return function(a0, a1, a2, a3, a4) {return fn.apply(this, arguments);};
    case 6: return function(a0, a1, a2, a3, a4, a5) {return fn.apply(this, arguments);};
    case 7: return function(a0, a1, a2, a3, a4, a5, a6) {return fn.apply(this, arguments);};
    case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) {return fn.apply(this, arguments);};
    case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {return fn.apply(this, arguments);};
    case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {return fn.apply(this, arguments);};
    default: throw new Error('First argument to arity must be a non-negative integer no greater than ten');
  }
});

},{"./internal/_curry2":27}],23:[function(_require,module,exports){
var _curry2 = _require('./internal/_curry2');
var arity = _require('./arity');


/**
 * Creates a function that is bound to a context.
 * Note: `R.bind` does not provide the additional argument-binding capabilities of
 * [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
 *
 * @func
 * @memberOf R
 * @category Function
 * @category Object
 * @see R.partial
 * @sig (* -> *) -> {*} -> (* -> *)
 * @param {Function} fn The function to bind to context
 * @param {Object} thisObj The context to bind `fn` to
 * @return {Function} A function that will execute in the context of `thisObj`.
 */
module.exports = _curry2(function bind(fn, thisObj) {
  return arity(fn.length, function() {
    return fn.apply(thisObj, arguments);
  });
});

},{"./arity":22,"./internal/_curry2":27}],24:[function(_require,module,exports){
var _curry1 = _require('./internal/_curry1');
var curryN = _require('./curryN');


/**
 * Returns a curried equivalent of the provided function. The curried
 * function has two unusual capabilities. First, its arguments needn't
 * be provided one at a time. If `f` is a ternary function and `g` is
 * `R.curry(f)`, the following are equivalent:
 *
 *   - `g(1)(2)(3)`
 *   - `g(1)(2, 3)`
 *   - `g(1, 2)(3)`
 *   - `g(1, 2, 3)`
 *
 * Secondly, the special placeholder value `R.__` may be used to specify
 * "gaps", allowing partial application of any combination of arguments,
 * regardless of their positions. If `g` is as above and `_` is `R.__`,
 * the following are equivalent:
 *
 *   - `g(1, 2, 3)`
 *   - `g(_, 2, 3)(1)`
 *   - `g(_, _, 3)(1)(2)`
 *   - `g(_, _, 3)(1, 2)`
 *   - `g(_, 2)(1)(3)`
 *   - `g(_, 2)(1, 3)`
 *   - `g(_, 2)(_, 3)(1)`
 *
 * @func
 * @memberOf R
 * @category Function
 * @sig (* -> a) -> (* -> a)
 * @param {Function} fn The function to curry.
 * @return {Function} A new, curried function.
 * @see R.curryN
 * @example
 *
 *      var addFourNumbers = function(a, b, c, d) {
 *        return a + b + c + d;
 *      };
 *
 *      var curriedAddFourNumbers = R.curry(addFourNumbers);
 *      var f = curriedAddFourNumbers(1, 2);
 *      var g = f(3);
 *      g(4); //=> 10
 */
module.exports = _curry1(function curry(fn) {
  return curryN(fn.length, fn);
});

},{"./curryN":25,"./internal/_curry1":26}],25:[function(_require,module,exports){
var _curry2 = _require('./internal/_curry2');
var _curryN = _require('./internal/_curryN');
var arity = _require('./arity');


/**
 * Returns a curried equivalent of the provided function, with the
 * specified arity. The curried function has two unusual capabilities.
 * First, its arguments needn't be provided one at a time. If `g` is
 * `R.curryN(3, f)`, the following are equivalent:
 *
 *   - `g(1)(2)(3)`
 *   - `g(1)(2, 3)`
 *   - `g(1, 2)(3)`
 *   - `g(1, 2, 3)`
 *
 * Secondly, the special placeholder value `R.__` may be used to specify
 * "gaps", allowing partial application of any combination of arguments,
 * regardless of their positions. If `g` is as above and `_` is `R.__`,
 * the following are equivalent:
 *
 *   - `g(1, 2, 3)`
 *   - `g(_, 2, 3)(1)`
 *   - `g(_, _, 3)(1)(2)`
 *   - `g(_, _, 3)(1, 2)`
 *   - `g(_, 2)(1)(3)`
 *   - `g(_, 2)(1, 3)`
 *   - `g(_, 2)(_, 3)(1)`
 *
 * @func
 * @memberOf R
 * @category Function
 * @sig Number -> (* -> a) -> (* -> a)
 * @param {Number} length The arity for the returned function.
 * @param {Function} fn The function to curry.
 * @return {Function} A new, curried function.
 * @see R.curry
 * @example
 *
 *      var addFourNumbers = function() {
 *        return R.sum([].slice.call(arguments, 0, 4));
 *      };
 *
 *      var curriedAddFourNumbers = R.curryN(4, addFourNumbers);
 *      var f = curriedAddFourNumbers(1, 2);
 *      var g = f(3);
 *      g(4); //=> 10
 */
module.exports = _curry2(function curryN(length, fn) {
  return arity(length, _curryN(length, [], fn));
});

},{"./arity":22,"./internal/_curry2":27,"./internal/_curryN":28}],26:[function(_require,module,exports){
/**
 * Optimized internal two-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */
module.exports = function _curry1(fn) {
  return function f1(a) {
    if (arguments.length === 0) {
      return f1;
    } else if (a != null && a['@@functional/placeholder'] === true) {
      return f1;
    } else {
      return fn(a);
    }
  };
};

},{}],27:[function(_require,module,exports){
var _curry1 = _require('./_curry1');


/**
 * Optimized internal two-arity curry function.
 *
 * @private
 * @category Function
 * @param {Function} fn The function to curry.
 * @return {Function} The curried function.
 */
module.exports = function _curry2(fn) {
  return function f2(a, b) {
    var n = arguments.length;
    if (n === 0) {
      return f2;
    } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
      return f2;
    } else if (n === 1) {
      return _curry1(function(b) { return fn(a, b); });
    } else if (n === 2 && a != null && a['@@functional/placeholder'] === true &&
                          b != null && b['@@functional/placeholder'] === true) {
      return f2;
    } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
      return _curry1(function(a) { return fn(a, b); });
    } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
      return _curry1(function(b) { return fn(a, b); });
    } else {
      return fn(a, b);
    }
  };
};

},{"./_curry1":26}],28:[function(_require,module,exports){
var arity = _require('../arity');


/**
 * Internal curryN function.
 *
 * @private
 * @category Function
 * @param {Number} length The arity of the curried function.
 * @return {array} An array of arguments received thus far.
 * @param {Function} fn The function to curry.
 */
module.exports = function _curryN(length, received, fn) {
  return function() {
    var combined = [];
    var argsIdx = 0;
    var left = length;
    var combinedIdx = 0;
    while (combinedIdx < received.length || argsIdx < arguments.length) {
      var result;
      if (combinedIdx < received.length &&
          (received[combinedIdx] == null ||
           received[combinedIdx]['@@functional/placeholder'] !== true ||
           argsIdx >= arguments.length)) {
        result = received[combinedIdx];
      } else {
        result = arguments[argsIdx];
        argsIdx += 1;
      }
      combined[combinedIdx] = result;
      if (result == null || result['@@functional/placeholder'] !== true) {
        left -= 1;
      }
      combinedIdx += 1;
    }
    return left <= 0 ? fn.apply(this, combined) : arity(left, _curryN(length, combined, fn));
  };
};

},{"../arity":22}],29:[function(_require,module,exports){
module.exports = function _has(prop, obj) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

},{}],30:[function(_require,module,exports){
/**
 * Tests whether or not an object is an array.
 *
 * @private
 * @param {*} val The object to test.
 * @return {Boolean} `true` if `val` is an array, `false` otherwise.
 * @example
 *
 *      _isArray([]); //=> true
 *      _isArray(null); //=> false
 *      _isArray({}); //=> false
 */
module.exports = Array.isArray || function _isArray(val) {
  return (val != null &&
          val.length >= 0 &&
          Object.prototype.toString.call(val) === '[object Array]');
};

},{}],31:[function(_require,module,exports){
var _xwrap = _require('./_xwrap');
var bind = _require('../bind');
var isArrayLike = _require('../isArrayLike');


module.exports = (function() {
  function _arrayReduce(xf, acc, list) {
    var idx = 0, len = list.length;
    while (idx < len) {
      acc = xf['@@transducer/step'](acc, list[idx]);
      if (acc && acc['@@transducer/reduced']) {
        acc = acc['@@transducer/value'];
        break;
      }
      idx += 1;
    }
    return xf['@@transducer/result'](acc);
  }

  function _iterableReduce(xf, acc, iter) {
    var step = iter.next();
    while (!step.done) {
      acc = xf['@@transducer/step'](acc, step.value);
      if (acc && acc['@@transducer/reduced']) {
        acc = acc['@@transducer/value'];
        break;
      }
      step = iter.next();
    }
    return xf['@@transducer/result'](acc);
  }

  function _methodReduce(xf, acc, obj) {
    return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
  }

  var symIterator = (typeof Symbol !== 'undefined') ? Symbol.iterator : '@@iterator';
  return function _reduce(fn, acc, list) {
    if (typeof fn === 'function') {
      fn = _xwrap(fn);
    }
    if (isArrayLike(list)) {
      return _arrayReduce(fn, acc, list);
    }
    if (typeof list.reduce === 'function') {
      return _methodReduce(fn, acc, list);
    }
    if (list[symIterator] != null) {
      return _iterableReduce(fn, acc, list[symIterator]());
    }
    if (typeof list.next === 'function') {
      return _iterableReduce(fn, acc, list);
    }
    throw new TypeError('reduce: list must be array or iterable');
  };
})();

},{"../bind":23,"../isArrayLike":33,"./_xwrap":32}],32:[function(_require,module,exports){
module.exports = (function() {
  function XWrap(fn) {
    this.f = fn;
  }
  XWrap.prototype['@@transducer/init'] = function() {
    throw new Error('init not implemented on XWrap');
  };
  XWrap.prototype['@@transducer/result'] = function(acc) { return acc; };
  XWrap.prototype['@@transducer/step'] = function(acc, x) {
    return this.f(acc, x);
  };

  return function _xwrap(fn) { return new XWrap(fn); };
}());

},{}],33:[function(_require,module,exports){
var _curry1 = _require('./internal/_curry1');
var _isArray = _require('./internal/_isArray');


/**
 * Tests whether or not an object is similar to an array.
 *
 * @func
 * @memberOf R
 * @category Type
 * @category List
 * @sig * -> Boolean
 * @param {*} x The object to test.
 * @return {Boolean} `true` if `x` has a numeric length property and extreme indices defined; `false` otherwise.
 * @example
 *
 *      R.isArrayLike([]); //=> true
 *      R.isArrayLike(true); //=> false
 *      R.isArrayLike({}); //=> false
 *      R.isArrayLike({length: 10}); //=> false
 *      R.isArrayLike({0: 'zero', 9: 'nine', length: 10}); //=> true
 */
module.exports = _curry1(function isArrayLike(x) {
  if (_isArray(x)) { return true; }
  if (!x) { return false; }
  if (typeof x !== 'object') { return false; }
  if (x instanceof String) { return false; }
  if (x.nodeType === 1) { return !!x.length; }
  if (x.length === 0) { return true; }
  if (x.length > 0) {
    return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
  }
  return false;
});

},{"./internal/_curry1":26,"./internal/_isArray":30}],34:[function(_require,module,exports){
var _curry1 = _require('./internal/_curry1');
var _has = _require('./internal/_has');


/**
 * Returns a list containing the names of all the enumerable own
 * properties of the supplied object.
 * Note that the order of the output array is not guaranteed to be
 * consistent across different JS platforms.
 *
 * @func
 * @memberOf R
 * @category Object
 * @sig {k: v} -> [k]
 * @param {Object} obj The object to extract properties from
 * @return {Array} An array of the object's own properties.
 * @example
 *
 *      R.keys({a: 1, b: 2, c: 3}); //=> ['a', 'b', 'c']
 */
module.exports = (function() {
  // cover IE < 9 keys issues
  var hasEnumBug = !({toString: null}).propertyIsEnumerable('toString');
  var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString',
                            'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var contains = function contains(list, item) {
    var idx = 0;
    while (idx < list.length) {
      if (list[idx] === item) {
        return true;
      }
      idx += 1;
    }
    return false;
  };

  return typeof Object.keys === 'function' ?
    _curry1(function keys(obj) {
      return Object(obj) !== obj ? [] : Object.keys(obj);
    }) :
    _curry1(function keys(obj) {
      if (Object(obj) !== obj) {
        return [];
      }
      var prop, ks = [], nIdx;
      for (prop in obj) {
        if (_has(prop, obj)) {
          ks[ks.length] = prop;
        }
      }
      if (hasEnumBug) {
        nIdx = nonEnumerableProps.length - 1;
        while (nIdx >= 0) {
          prop = nonEnumerableProps[nIdx];
          if (_has(prop, obj) && !contains(ks, prop)) {
            ks[ks.length] = prop;
          }
          nIdx -= 1;
        }
      }
      return ks;
    });
}());

},{"./internal/_curry1":26,"./internal/_has":29}],35:[function(_require,module,exports){
var _curry2 = _require('./internal/_curry2');
var _reduce = _require('./internal/_reduce');
var keys = _require('./keys');


/**
 * Map, but for objects. Creates an object with the same keys as `obj` and values
 * generated by running each property of `obj` through `fn`. `fn` is passed one argument:
 * *(value)*.
 *
 * @func
 * @memberOf R
 * @category Object
 * @sig (v -> v) -> {k: v} -> {k: v}
 * @param {Function} fn A function called for each property in `obj`. Its return value will
 * become a new property on the return object.
 * @param {Object} obj The object to iterate over.
 * @return {Object} A new object with the same keys as `obj` and values that are the result
 *         of running each property through `fn`.
 * @example
 *
 *      var values = { x: 1, y: 2, z: 3 };
 *      var double = function(num) {
 *        return num * 2;
 *      };
 *
 *      R.mapObj(double, values); //=> { x: 2, y: 4, z: 6 }
 */
module.exports = _curry2(function mapObject(fn, obj) {
  return _reduce(function(acc, key) {
    acc[key] = fn(obj[key]);
    return acc;
  }, {}, keys(obj));
});

},{"./internal/_curry2":27,"./internal/_reduce":31,"./keys":34}],36:[function(_require,module,exports){
var _curry2 = _require('./internal/_curry2');


/**
 * Returns a function that when supplied an object returns the indicated property of that object, if it exists.
 *
 * @func
 * @memberOf R
 * @category Object
 * @sig s -> {s: a} -> a
 * @param {String} p The property name
 * @param {Object} obj The object to query
 * @return {*} The value at `obj.p`.
 * @example
 *
 *      R.prop('x', {x: 100}); //=> 100
 *      R.prop('x', {}); //=> undefined
 */
module.exports = _curry2(function prop(p, obj) { return obj[p]; });

},{"./internal/_curry2":27}],37:[function(_require,module,exports){
var isDom = _require('is-dom')
var Map = _require('ez-map')
var containers = new Map()

/**
 * Create a new container. If a container already exists for a node,
 * that will be returned instead.
 */

exports.create = function (node) {
  var container = containers.get(node)
  if (container) {
    return container
  }
  if (!isDom(node)) {
    throw new TypeError('Container element must be a DOM element')
  }
  if (node.children.length > 0) {
    console.info('The container element is not empty. These elements will be removed. Read more: http://cl.ly/b0Sr')
    node.innerHTML = ''
  }
  if (node === document.body) {
    console.warn('Using document.body is allowed but it can cause some issues. Read more: http://cl.ly/b0SC')
  }
  var container = {
    id: uid(),
    node: node,
    children: {},
    nativeElement: null,
    virtualElement: null,
  }
  containers.set(node, container)
  return container
}

exports.get = function (node) {
  return containers.get(node)
}

exports.remove = function (node) {
  containers.delete(node)
}

},{"ez-map":4,"is-dom":16}],38:[function(_require,module,exports){
/**
 * Move a DOM element to a new index within it's parent
 */

exports.insertAt = function (element, newPosition, childEl) {
  var target = element.childNodes[newPosition]
  if (childEl !== target) {
    if (target) {
      element.insertBefore(childEl, target)
    } else {
      element.appendChild(childEl)
    }
  }
}

},{}],39:[function(_require,module,exports){
var raf = _require('component-raf')
var frames = {}

/**
 * Tell the container it's dirty and needs to re-render.
 */

exports.set = function (id, fn) {
  exports.clear(id)
  frames[id] = raf(fn)
  return id
}

/**
 * Clear the current scheduled frame
 */

exports.clear = function (id) {
  var frameId = frames[id]
  if (frameId) {
    raf.cancel(frameId)
    delete frames[id]
  }
}

},{"component-raf":1}],40:[function(_require,module,exports){
var keypath = _require('object-path')
var handlers = {}

/**
 * Get a handler for an entity
 */

exports.get = function (path) {
  keypath.get(handlers, path)
}

/**
 * Add an event handler for an entity at a path
 */

exports.set = function (path, fn) {
  keypath.set(handlers, path, fn)
}

/**
 * Remove a single event handler for an entity
 */

exports.remove = curry(function (path) {
  keypath.del(handlers, path)
})

/**
 * Remove all event handlers for an entity
 */

exports.removeAll = curry(function (path) {
  keypath.del(handlers, path)
})

},{"object-path":21}],41:[function(_require,module,exports){
var tree = _require('../shared/tree')
var uid = _require('get-uid')
var defaults = _require('object-defaults')
var isPromise = _require('is-promise')
var isEmpty = _require('is-empty')
var events = _require('../shared/events')
var isSVGAttribute = _require('is-svg-attribute')
var frame = _require('./frame')
var handler = _require('./handler')
var dom = _require('./dom')
var containers = _require('./container')
var svgNamespace = 'http://www.w3.org/2000/svg'
var elementHelpers = _require('../shared/element')
var nodeType = elementHelpers.nodeType

// Ramda
var curry = _require('ramda/src/curry')
var prop = _require('ramda/src/prop')
var mapObj = _require('ramda/src/mapObj')
// var pipe = require('ramda/src/pipe')

// Fast.js
var forEach = _require('fast.js/forEach')
var assign = _require('fast.js/object/assign')
var indexOf = _require('fast.js/array/indexOf')
var reduce = _require('fast.js/reduce')

/**
 * Entity Tree Functions
 * ============================================================================
 */

 /**
  * Creates a component instance (entity) from a virtual element.
  */

var createEntity = function (container, parent, path, vnode) {
  var component = getComponent(vnode)
  var props = defaults(vnode.attributes, component.defaultProps)
  var state = component.initialState ? component.initialState(props) : {}
  var entity = {
    id: uid(),
    type: component,
    path: path,
    owner: parent,
    containerId: container.id,
    props: props,
    state: state,
    virtualElement: null,
    nativeElement: null,
    pendingState: null,
    pendingProps: null,
    children: {}
  }
  entity.updateState = updateState(container, entity)
  entity.updateProps = updateProps(container, entity)
  var virtualElement = renderEntity(entity)
  var nativeElement = renderElement(container, entity, '0', virtualElement)
  entity.virtualElement = virtualElement
  entity.nativeElement = nativeElement
  return entity
}

/**
 * Render an entity to get the new virtual node
 */

var renderEntity = function (entity) {
  var component = entity.type
  var result = component.render(entity, entity.updateState)
  if (!result) throw new TypeError('Render function must return an element.')
  return result
}

/**
 * Update a component instance.
 */

var updateEntity = function (entity) {
  var virtualElement = entity.virtualElement
  var nativeElement = entity.nativeElement
  var previousState = entity.state
  var previousProps = entity.props
  commitEntity(entity)
  if (!shouldRender(entity)) return updateChildren(entity)
  var nextElement = renderEntity(entity)
  if (nextElement === virtualElement) return updateChildren(entity)
  entity.nativeElement = patchNativeElement(container, entity, virtualElement, nextElement, nativeElement)
  entity.virtualElement = nextElement
  updateChildren(entity)
  trigger('afterRender', entity, [entity, updatedElement])
  trigger('afterUpdate', entity, [entity, previousProps, previousState])
}

/**
 * Commit props and state changes to an entity.
 */

var commitEntity = function (entity) {
  entity.state = merge(entity.state, entity.pendingState)
  entity.props = merge(entity.props, entity.pendingProps)
  delete entity.pendingState
  delete entity.pendingProps
}

/**
 * Remove an entity and all it's children from the entity tree
 */

var removeEntity = function (container, path, entity) {
  var branch = pruneTree(path, container)
  tree.iterateUp(beforeUnmount, branch)
}

/**
 * Check to see if an entity needs a render
 */

var shouldRender = function (entity) {
  if (!isDirty(entity)) return false
  var fn = entity.type.shouldRender || entity.type.shouldUpdate
  if (!fn) return true
  return fn(entity, entity.pendingProps, entity.pendingState)
}

/**
 * Is an entity dirty and in need of a re-render?
 *
 * @param {Object} entity
 *
 * @return {Boolean}
 */

var isDirty = function (entity) {
  return entity.pendingProps || entity.pendingState
}

/**
 * Trigger a hook on a component.
 */

var trigger = function (name, entity, args) {
  var fn = entity.type[name]
  if (!fn) return
  return fn(args)
}

/**
 * Update all entities in a branch that have the same nativeElement. This
 * happens when a component has another component as it's root node.
 */

var updateEntityNativeElement = function (entity, newEl) {
  if (!entity) return
  if (entity.owner.children['0'] === entity) {
    entity.owner.nativeElement = newEl
    updateEntityNativeElement(entity.parent, newEl)
  }
}

/**
 * Update all the children of an entity.
 *
 * (Entity) -> void
 */

var updateChildren = pipe(
  prop('children'),
  mapObj(updateEntity)
)

/**
 * Remove all of the child entities of an entity
 * (Entity) -> void
 */

var removeChildren = pipe(
  prop('children'),
  mapObj(removeEntity)
)

/**
 * Virtual Tree Functions
 * ============================================================================
 */

/*
 * Removes an element from the DOM and unmounts and components
 * that are within that branch
 */

var getVirtualElement = function (path, virtualElement) {
  return tree.get(path, virtualElement)
}

var removeNativeElement = function () {}
var removeHandlers = function () {}

/**
 * Replace an element in the DOM. Removing all components
 * within that element and re-rendering the new virtual node.
 */

var replaceElement = function (container, entity, path, el, vnode) {
  removeNestedComponents(container, entity, path)
  removeNestedHandlers(container, path)
  var newEl = renderElement(container, entity, path, vnode)
  insertElement(newEl, indexOf(el, el.parentNode.children), parent)
  updateEntityNativeElement(container, entity, newEl)
  return newEl
}

/**
 * Insert an entity into the entity tree
 */

var insertElement = function (container, entity, path, nativeElement, virtualElement) {
  var el = renderElement(container, entity, path, virtualElement)
  var index = path.split('.').pop()
  insertAt(el, index, nativeElement)
}

/**
 * Move an element to a new position.
 */

var moveElement = curry(function (entity, parentElement, position) {

})

/**
 * Create a native element from a virtual element.
 */

var renderElement = function (container, entity, path, vnode) {
  switch (nodeType(vnode)) {
    case 'text':
      return document.createTextNode(vnode)
    case 'element':
      return toNativeElement(container, entity, path, vnode)
    case 'component':
      var child = createEntity(container, entity, path, vnode)
      entity.children[path] = child
      mountQueue.push(entity)
      return child.nativeElement
  }
}

/**
 * State control
 * ============================================================================
 */

/**
 * Update the entity state using a promise
 */

var updateState = curry(function (container, entity, nextState) {
  if (!nextState) return
  if (isPromise(nextState)) return nextState.then(updateState(container, entity))
  entity.pendingState = merge(entity.pendingState, nextState)
  invalidate(container)
})

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * (EntityId, nextProps) -> void
 */

var updateProps = curry(function (container, entity, nextProps) {
  entity.pendingProps = nextProps
  invalidate(container)
})

/**
 * Invalidate the container for an entity
 * (Container) -> void
 */

var invalidate = function (container) {
  frame.set(container.id, function () {
    render(container.node, container.virtualElement)
  })
}

/**
 * DOM Functions
 * ============================================================================
 */

/**
 * Patch an container with a new virtual element
 */

var patchNativeElement = function (container, entity, previousElement, nextElement, nativeElement) {
  return reduce(
    diff(previousElement, nextElement),
    patch(container, entity),
    nativeElement
  )
}

/**
 * Apply a patch to an element
 */

var patch = curry(function (container, entity, parentElement, change) {
  var path = change.path
  var nextElement = change.nextElement
  var previousElement = change.previousElement
  var nativeElement = getElementByPath(change.path, parentElement)
  switch (change.type) {
    case 'text':
      nativeElement.data = change.value
    case 'replace':
      replaceElement(container, entity, path, nativeElement, nextElement)
    case 'remove':
      removeElement(container, entity, path, nativeElement)
    case 'insert':
      insertElement(container, entity, path, nativeElement, nextElement)
    case 'move':
      forEach(change.positions, moveElement(entity, nativeElement))
    case 'update':
      updateProps(container, getEntity(change.path, container), change.value)
  }
})

// var removeElement = function(container, entity, path, nativeElement) {
//   removeNestedComponents()
//   removeNativeElement(path, nativeElement)
// }

// var removeNestedComponents = function () {
//   for (var childPath in entity.children) {

//   }
//   forEach(getNestedComponents(path, entity), removeEntity)
// }

/**
 * Create a native element from a virtual element.
 */

var toNativeElement = function (container, entity, path, vnode) {
  var el = createElement(vnode.type)
  el.__entity__ = entity.id
  el.__container__ = container.id
  forEach(vnode.attributes, setAttribute(container, entity, path, el))
  forEach(vnode.children, function (child, i) {
    if (child == null) return
    var childEl = renderElement(container, entity, path + '.' + i, child)
    el.appendChild(childEl)
  })
  return el
}

/**
 * Create an event handler that can return a value to update state
 * instead of relying on side-effects.
 */

var handleEvent = curry(function (container, entity, fn, e) {
  if (entity) {
    var update = updateState(container, entity)
    update(fn(e, entity, update))
  } else {
    fn(e)
  }
})

/**
 * Handle an event that has occured within the container
 *
 * @param {Event} event
 */

var handleNativeEvent = function (event) {
  var target = event.target
  while (target) {
    var fn = handler.get([target.__container__, event.type, target.__entity__, target.__path__])
    if (fn) {
      event.delegateTarget = target
      fn(event)
      break
    }
    target = target.parentNode
  }
}

/**
 * Set the attribute of an element, performing additional transformations
 * dependning on the attribute name
 */

var setAttribute = function (container, entity, path, el, value, name) {
  if (events[name]) {
    handler.set([container.id, events[name], entity.id, path], handleEvent(container, entity, value))
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = true
      el.setAttribute(name, value)
      break
    case 'innerHTML':
    case 'value':
      el[name] = value
      break
    case isSVGAttribute(name):
      el.setAttributeNS(svgNamespace, name, value)
      break
    default:
      el.setAttribute(name, value)
      break
  }
}

/**
 * Remove an attribute, performing additional transformations
 * depending on the attribute name
 */

var removeAttribute = function (container, entity, path, el, name) {
  if (events[name]) {
    handler.remove([container.id, events[name], entity.id, path])
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = false
      el.removeAttribute(name)
      break
    case 'innerHTML':
    case 'value':
      el[name] = ''
      break
    default:
      el.removeAttribute(name)
      break
  }
}

/**
 * Add all of the DOM event listeners
 */

var addNativeEventListeners = function (container) {
  forEach(events, function (eventType) {
    document.body.addEventListener(eventType, handleNativeEvent, true)
  })
}

/**
 * Add all of the DOM event listeners
 */

var removeNativeEventListeners = function (container) {
  forEach(events, function (eventType) {
    document.body.removeEventListener(eventType, handleNativeEvent, true)
  })
}

/**
 * Helper Functions
 * ============================================================================
 */

/**
 * Maybe merge two objects
 */

function merge (one, two) {
  return assign(one || {}, two || {})
}

/**
 * Get the component from a virtual element
 */

var getComponent = function (vnode) {
  var component = vnode.type
  validateComponent(component)
  return component
}

/**
 * Call hooks for all new entities that have been created in
 * the last render from the bottom up.
 */

var flushMountQueue = function () {
  while (mountQueue.length) {
    var entity = mountQueue.pop()
    trigger('afterRender', entity, [entity, entity.nativeElement])
    entity.updateState(trigger('afterMount', entity, [entity, entity.nativeElement, entity.updateState]))
  }
}

/**
 * Exports
 * ============================================================================
 */

/**
 * Render a vnode into a container. If that container already exists
 * we'll just perform an update.
 */

exports.render = curry(function (node, nextElement) {
  var container = createContainer(node)
  var nativeElement = container.nativeElement
  var virtualElement = container.virtualElement
  frame.clear(container.id)
  if (!nativeElement) {
    container.nativeElement = renderElement(container, null, '0', nextElement)
    node.appendChild(container.nativeElement)
  } else {
    container.nativeElement = patchElement(container, null, virtualElement, nextElement, nativeElement)
    container.virtualElement = nextElement
    updateChildren(container)
  }
  flushMountQueue()
})

/**
 * Remove any virtual elements from a DOM element container
 *
 * (Node) -> undefined
 */

exports.remove = function (node) {
  var container = containers.get(node)
  removeNativeEventListeners(container)
  removeNativeElement(container, 'root', '0', container.nativeElement)
  containers.remove(container)
  frame.remove(container.id)
}

/**
 * Inspect the tree of components within a DOM element container
 *
 * (HTMLElement) -> Object
 */

exports.inspect = function (node) {
  return containers.get(node)
}

/**
 * Update the state of an entity.
 *
 * (EntityId, Object) -> void
 */

exports.updateState = updateState

/**
 * Update the props of an entity
 *
 * (EntityId, Object) -> void
 */

exports.updateProps = updateProps

},{"../shared/element":44,"../shared/events":45,"../shared/tree":46,"./container":37,"./dom":38,"./frame":39,"./handler":40,"fast.js/array/indexOf":6,"fast.js/forEach":8,"fast.js/object/assign":11,"fast.js/reduce":14,"get-uid":15,"is-empty":17,"is-promise":18,"is-svg-attribute":19,"object-defaults":20,"ramda/src/curry":24,"ramda/src/mapObj":35,"ramda/src/prop":36}],42:[function(_require,module,exports){
// Client rendering
if (typeof document !== 'undefined') {
  var client = _require('./client')
  exports.render = client.render
  exports.remove = client.remove
  exports.inspect = client.inspect
}

// Server rendering
exports.renderString = _require('./server')

},{"./client":41,"./server":43}],43:[function(_require,module,exports){
var events = _require('../shared/events')
var nodeType = _require('../shared/element').nodeType
var defaults = _require('object-defaults')

module.exports = render

function render (element) {
  return nodeToString(element, '0')
}

function componentToString (component, optProps) {
  var props = defaults(optProps, component.defaultProps)
  var state = component.initialState ? component.initialState(props) : {}
  var node = component.render({ props: props, state: state })
  return nodeToString(node, '0')
}

function nodeToString (node, path) {
  if (node == null) return ''
  switch (nodeType(node)) {
    case 'text':
      return node
    case 'element':
      var children = node.children
      var attributes = node.attributes
      var tagName = node.type
      var innerHTML = attributes.innerHTML
      var str = '<' + tagName + attributesToString(attributes) + '>'
      if (innerHTML) {
        str += innerHTML
      } else {
        for (var i = 0, n = children.length; i < n; i++) {
          str += nodeToString(children[i], path + '.' + i)
        }
      }
      str += '</' + tagName + '>'
      return str
    case 'component':
      return componentToString(node.type, node.props)
  }
}

function attributesToString (attributes) {
  var str = ''
  for (var key in attributes) {
    if (key === 'innerHTML') continue
    if (events[key]) continue
    str += attributeToString(key, attributes[key])
  }
  return str
}

function attributeToString (key, val) {
  return ' ' + key + '="' + val + '"'
}

},{"../shared/element":44,"../shared/events":45,"object-defaults":20}],44:[function(_require,module,exports){
var type = _require('component-type')

/**
 * Returns the type of a virtual node
 *
 * @param  {Object} node
 * @return {String}
 */

exports.nodeType = function (node) {
  if (type(node) === 'string') return 'text'
  if (type(node.type) === 'string') return 'element'
  return 'component'
}

},{"component-type":2}],45:[function(_require,module,exports){
/**
 * All of the events can bind to. The keys are the attribute names we expect
 * and the values are the actual DOM events they map to. We can use this in
 * both the DOM and string renderer so we can treat these as a special case.
 */

module.exports = {
  onBlur: 'blur',
  onChange: 'change',
  onClick: 'click',
  onContextMenu: 'contextmenu',
  onCopy: 'copy',
  onCut: 'cut',
  onDoubleClick: 'dblclick',
  onDrag: 'drag',
  onDragEnd: 'dragend',
  onDragEnter: 'dragenter',
  onDragExit: 'dragexit',
  onDragLeave: 'dragleave',
  onDragOver: 'dragover',
  onDragStart: 'dragstart',
  onDrop: 'drop',
  onFocus: 'focus',
  onInput: 'input',
  onKeyDown: 'keydown',
  onKeyPress: 'keypress',
  onKeyUp: 'keyup',
  onMouseDown: 'mousedown',
  onMouseEnter: 'mouseenter',
  onMouseLeave: 'mouseleave',
  onMouseMove: 'mousemove',
  onMouseOut: 'mouseout',
  onMouseOver: 'mouseover',
  onMouseUp: 'mouseup',
  onPaste: 'paste',
  onScroll: 'scroll',
  onSubmit: 'submit',
  onTouchCancel: 'touchcancel',
  onTouchEnd: 'touchend',
  onTouchMove: 'touchmove',
  onTouchStart: 'touchstart',
  onWheel: 'wheel'
}

},{}],46:[function(_require,module,exports){
var curry = _require('curry')

/*

This module makes it easy to work with element trees. This is the same kind of tree
that's used for the virtual DOM and the kind that we store the rendered components in.

A node in the tree has a type, attributes and children. Here's an example:

```
{
  type: Component,
  attributes: {
    id: 213131123,
    ownerId: 2234234,
    props: {},
    state: {},
    nativeElement: Node,
    virtualElement: VNode
  },
  children: [{
    type: Component,
    attributes: {
      id: 213131123,
      ownerId: 2234234,
      props: {},
      state: {}
    },
    children: [{
      type: Component,
      attributes: {
        id: 213131123,
        ownerId: 2234234,
        props: {},
        state: {}
      },
      children: []
    }]
  }]
}
```

We reference nodes in the tree using index strings, eg. 0.1.4.5, which refer
to the index of the children at each node.

 */

/**
 * Convert a string path into a path we can use
 */

var pathToArray = function (path) {
  if (Array.isArray(path)) return path
  return path.split('.')
}

/**
 * Get a node at a path
 */

var get = function (target, node) {
  var path = pathToArray(target)
  while (path.length) {
    node = node.children[path.shift()]
  }
  return node
}

/**
 * Remove a node from the tree given a string path
 */

var prune = function (target, node) {
  var path = pathToArray(target)
  var targetIndex = path.pop()
  var parentNode = get(path, node)
  parentNode.children.splice(targetIndex, 1)
  return node
}

/**
 * Insert a new node into the tree at a path
 */

var graft = function (target, newNode, node) {
  var path = pathToArray(target)
  var targetIndex = path.pop()
  var parentNode = get(path, node)
  parentNode.children.splice(targetIndex, 0, newNode)
  return node
}

/**
 * Walk down a node and apply a function to each node
 */

var walkPre = curry(function (fn, node) {
  fn(node)
  node.children.forEach(traverse(fn))
})

/**
 * Climb up a tree from the leaf nodes
 */

var walkPost = curry(function (fn, node) {
  node.children.forEach(climb(fn))
  fn(node)
})

/**
 * Move a node to another location in the tree
 */

var move = curry(function (from, to, node) {
  var target = get(from, node)
  var toPath = pathToArray(to)
  var newIndex = toPath.pop()
  var parentNode = get(toPath, node)
  parentNode.children.splice(newIndex, 0, target)
  return node
})

/**
 * Check if a path is actually the root.
 */

var isRoot = function (path) {
  return path === '0'
}

/**
 * Checks to see if one tree path is within
 * another tree path. Example:
 *
 * 0.1 vs 0.1.1 = true
 * 0.2 vs 0.3.5 = false
 */

var isWithinPath = function (parentPath, childPath) {
  return childPath.indexOf(parentPath + '.') === 0
}

},{"curry":3}]},{},[42])(42)
});