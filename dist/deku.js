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
function Pool(params) {
    if (typeof params !== 'object') {
        throw new Error("Please pass parameters. Example -> new Pool({ tagName: \"div\" })");
    }

    if (typeof params.tagName !== 'string') {
        throw new Error("Please specify a tagName. Example -> new Pool({ tagName: \"div\" })");
    }

    this.storage = [];
    this.tagName = params.tagName.toLowerCase();
    this.namespace = params.namespace;
}

Pool.prototype.push = function(el) {
    if (el.tagName.toLowerCase() !== this.tagName) {
        return;
    }
    
    this.storage.push(el);
};

Pool.prototype.pop = function(argument) {
    if (this.storage.length === 0) {
        return this.create();
    } else {
        return this.storage.pop();
    }
};

Pool.prototype.create = function() {
    if (this.namespace) {
        return document.createElementNS(this.namespace, this.tagName);
    } else {
        return document.createElement(this.tagName);
    }
};

Pool.prototype.allocate = function(size) {
    if (this.storage.length >= size) {
        return;
    }

    var difference = size - this.storage.length;
    for (var poolAllocIter = 0; poolAllocIter < difference; poolAllocIter++) {
        this.storage.push(this.create());
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Pool;
}

},{}],4:[function(_require,module,exports){
var slice = Array.prototype.slice

module.exports = iterativelyWalk

function iterativelyWalk(nodes, cb) {
    if (!('length' in nodes)) {
        nodes = [nodes]
    }
    
    nodes = slice.call(nodes)

    while(nodes.length) {
        var node = nodes.shift(),
            ret = cb(node)

        if (ret) {
            return ret
        }

        if (node.childNodes && node.childNodes.length) {
            nodes = slice.call(node.childNodes).concat(nodes)
        }
    }
}

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

},{"../function/bindInternal3":8}],6:[function(_require,module,exports){
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

},{"../function/bindInternal4":9}],7:[function(_require,module,exports){
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
},{"./array/forEach":5,"./object/forEach":11}],8:[function(_require,module,exports){
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

},{}],9:[function(_require,module,exports){
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

},{}],10:[function(_require,module,exports){
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

},{}],11:[function(_require,module,exports){
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

},{"../function/bindInternal3":8}],12:[function(_require,module,exports){
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

},{"../function/bindInternal4":9}],13:[function(_require,module,exports){
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
},{"./array/reduce":6,"./object/reduce":12}],14:[function(_require,module,exports){
/** generate unique id for selector */
var counter = Date.now() % 1e9;

module.exports = function getUid(){
	return (Math.random() * 1e9 >>> 0) + (counter++);
};
},{}],15:[function(_require,module,exports){
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

},{}],16:[function(_require,module,exports){

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
},{}],17:[function(_require,module,exports){
module.exports = isPromise;

function isPromise(obj) {
  return obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

},{}],18:[function(_require,module,exports){
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

},{}],19:[function(_require,module,exports){
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

},{"./internal/_curry2":27}],20:[function(_require,module,exports){
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

},{"./arity":19,"./internal/_curry2":27}],21:[function(_require,module,exports){
var _compose = _require('./internal/_compose');
var _createComposer = _require('./internal/_createComposer');


/**
 * Creates a new function that runs each of the functions supplied as parameters in turn,
 * passing the return value of each function invocation to the next function invocation,
 * beginning with whatever arguments were passed to the initial invocation.
 *
 * Note that `compose` is a right-associative function, which means the functions provided
 * will be invoked in order from right to left. In the example `var h = compose(f, g)`,
 * the function `h` is equivalent to `f( g(x) )`, where `x` represents the arguments
 * originally passed to `h`.
 *
 * @func
 * @memberOf R
 * @category Function
 * @sig ((y -> z), (x -> y), ..., (b -> c), (a... -> b)) -> (a... -> z)
 * @param {...Function} functions A variable number of functions.
 * @return {Function} A new function which represents the result of calling each of the
 *         input `functions`, passing the result of each function call to the next, from
 *         right to left.
 * @example
 *
 *      var triple = function(x) { return x * 3; };
 *      var double = function(x) { return x * 2; };
 *      var square = function(x) { return x * x; };
 *      var squareThenDoubleThenTriple = R.compose(triple, double, square);
 *
 *      //≅ triple(double(square(5)))
 *      squareThenDoubleThenTriple(5); //=> 150
 */
module.exports = _createComposer(_compose);

},{"./internal/_compose":24,"./internal/_createComposer":25}],22:[function(_require,module,exports){
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

},{"./curryN":23,"./internal/_curry1":26}],23:[function(_require,module,exports){
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

},{"./arity":19,"./internal/_curry2":27,"./internal/_curryN":28}],24:[function(_require,module,exports){
/**
 * Basic, right-associative composition function. Accepts two functions and returns the
 * composite function; this composite function represents the operation `var h = f(g(x))`,
 * where `f` is the first argument, `g` is the second argument, and `x` is whatever
 * argument(s) are passed to `h`.
 *
 * This function's main use is to build the more general `compose` function, which accepts
 * any number of functions.
 *
 * @private
 * @category Function
 * @param {Function} f A function.
 * @param {Function} g A function.
 * @return {Function} A new function that is the equivalent of `f(g(x))`.
 * @example
 *
 *      var double = function(x) { return x * 2; };
 *      var square = function(x) { return x * x; };
 *      var squareThenDouble = _compose(double, square);
 *
 *      squareThenDouble(5); //≅ double(square(5)) => 50
 */
module.exports = function _compose(f, g) {
  return function() {
    return f.call(this, g.apply(this, arguments));
  };
};

},{}],25:[function(_require,module,exports){
var arity = _require('../arity');


/*
 * Returns a function that makes a multi-argument version of compose from
 * either _compose or _composeP.
 */
module.exports = function _createComposer(composeFunction) {
  return function() {
    var fn = arguments[arguments.length - 1];
    var length = fn.length;
    var idx = arguments.length - 2;
    while (idx >= 0) {
      fn = composeFunction(arguments[idx], fn);
      idx -= 1;
    }
    return arity(length, fn);
  };
};

},{"../arity":19}],26:[function(_require,module,exports){
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

},{"../arity":19}],29:[function(_require,module,exports){
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

},{"../bind":20,"../isArrayLike":33,"./_xwrap":32}],32:[function(_require,module,exports){
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
var raf = _require('component-raf')
var isDom = _require('is-dom')
var uid = _require('get-uid')
var defaults = _require('../shared/defaults')
var forEach = _require('fast.js/forEach')
var assign = _require('fast.js/object/assign')
var reduce = _require('fast.js/reduce')
var isPromise = _require('is-promise')
var curry = _require('ramda/src/curry')
var compose = _require('ramda/src/compose')
var mapObj = _require('ramda/src/mapObj')
var isEmpty = _require('is-empty')
var pool = _require('./pool')
var svg = _require('../shared/svg')
var pathHelpers = _require('../shared/path')
var events = _require('../shared/events')
var elementHelpers = _require('../shared/element')
var keypath = _require('object-path')
var nodeType = elementHelpers.nodeType
var createElement = pool.createElement
var returnElement = pool.returnElement
var isRoot = pathHelpers.isRoot
var isWithinPath = pathHelpers.isWithinPath
var handlers = {}
var containers = {}
var pendingProps = {}
var pendingState = {}
var entities = {}
var mountQueue = []
var children = {}
var frames = {}
var nativeElements = {}
var virtualElements = {}
var entityState = {}
var entityProps = {}
var inProgress = {}

/**
 * Get the container ID given an element
 *
 * @param {HTMLElement} node
 *
 * @return {String}
 */

var getContainerByNode = function (node) {
  for (var id in containers) {
    if (containers[id] === node) return id
  }
}

/**
 * Get a virtual element using the reference id.
 */

var getVirtualElement = function (id) {
  return virtualElements[id]
}

/**
 * Get a container DOM node using the reference id.
 */

var getContainer = function (id) {
  return containers[id]
}

/**
 * Get an entity using the entity id.
 */

var getEntity = function (id) {
  return entities[id]
}

/**
 * Get child entities by reference id.
 */

var getChildren = function (id) {
  return children[id]
}

/**
 * Update all the children of an entity.
 *
 * @param {String} id Component instance id.
 */

var updateChildren = function (entityId) {
  forEach(getChildren(entityId), updateEntity)
}

// var updateChildren = compose(map(updateEntity), getChildren)

/**
 * Remove all of the child entities of an entity
 *
 * @param {Entity} entity
 */

var unmountChildren = function (entityId) {
  forEach(getChildren(entityId), removeEntity)
}

/**
 * Tell the container it's dirty and needs to re-render.
 */

var scheduleFrame = function (containerId) {
  frames[containerId] = raf(function () {
    render(getContainer(containerId), getVirtualElement(containerId))
  })
}

/**
 * Clear the current scheduled frame
 */

var clearFrame = function (containerId) {
  var frameId = frames[containerId]
  if (frameId) {
    raf.cancel(frameId)
    delete frames[containerId]
  }
  return containerId
}

/**
 * Find the container id an entity belongs to
 */

var getEntityContainer = function (entity) {
  if (containers[entity.id]) return entity.id
  return getEntityContainer(entity.ownerId)
}

/**
 * Patch an element with the diff from two trees.
 */

var patch = function (entityId, prev, next, el) {
  return diffNode(entityId, '0', prev, next, el)
}

/**
 * Group an array of virtual nodes using their keys
 * @param  {Object} acc
 * @param  {Object} child
 * @return {Object}
 */

var keyMapReducer = function (acc, child) {
  if (child && child.key != null) acc[child.key] = child
  return acc
}

/**
 * Update the entity state using a promise
 *
 * @param {String} entityId
 * @param {Promise} promise
 */

var updateState = curry(function (entityId, nextState) {
  if (!nextState) return
  if (isPromise(nextState)) return nextState.then(updateState(entityId))
  pendingState[entityId] = assign(pendingState[entityId] || {}, nextState)
  invalidateEntity(entityId)
})

/**
 * Replace the props for an instance
 */

var replaceProps = function (entityId, nextProps) {
  pendingProps[entityId] = nextProps
  return entityId
}

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * (EntityId, nextProps) -> void
 */

var updateProps = compose(invalidateEntity, replaceProps)

/**
 * Invalidate the container for an entity
 * (EntityId) -> void
 */

var invalidateEntity = compose(scheduleFrame, clearFrame, getEntityContainer, getEntity)

/**
 * Add all of the DOM event listeners
 */

var addNativeEventListeners = function () {
  forEach(events, function (eventType) {
    document.body.addEventListener(eventType, handleNativeEvent, true)
  })
}

/**
 * Add all of the DOM event listeners
 */

var removeNativeEventListeners = function () {
  forEach(events, function (eventType) {
    document.body.removeEventListener(eventType, handleNativeEvent, true)
  })
}

/**
 * Get a handler for an entity
 */

var getHandler = function (entityId, path, eventType) {
  keypath.get(handlers, [entityId, path, eventType])
}

/**
 * Add an event handler for an entity at a path
 */

var addHandler = function (entityId, path, eventType, fn) {
  keypath.set(handlers, [entityId, path, eventType], fn)
}

/**
 * Remove a single event handler for an entity
 */

var removeHandler = function (entityId, path, eventType) {
  var args = [entityId]
  if (path) args.push(path)
  if (eventType) args.push(eventType)
  keypath.del(handlers, args)
}

/**
 * Remove all event handlers for an entity
 */

var removeAllHandlers = function (entityId) {
  keypath.del(handlers, [entityId])
}

/**
 * Is an entity dirty and in need of a re-render?
 *
 * @param {Object} entity
 *
 * @return {Boolean}
 */

var isDirty = function (entityId) {
  return entityId in pendingProps || entityId in pendingState
}

/**
 * A rendered component instance.
 */

var createEntity = function (id, type, ownerId) {
  return {
    id: id,
    ownerId: ownerId,
    type: type
  }
}

/**
 * Get the component state
 *
 * @param {Object} entity
 *
 * @return {Object}
 */

var toComponent = function (entityId) {
  return {
    id: entityId,
    props: entityProps[entityId],
    state: entityState[entityId]
  }
}

/**
 * Remove a container
 *
 * @param {Object} container
 */

var removeContainer = function (containerId) {
  clearFrame(containerId)
  removeElement(containerId, '0', nativeElements[containerId])
  delete nativeElements[containerId]
  delete virtualElements[containerId]
  delete containers[containerId]
  if (isEmpty(containers)) removeNativeEventListeners()
}

/**
 * Create a new container given an element
 *
 * @param {HTMLElement} container
 *
 * @return {String} id
 */

var createContainer = function (node) {
  if (!isDom(node)) {
    throw new TypeError('deku: Container element must be a DOM element')
  }
  if (getContainerByNode(node)) {
    throw new Error('deku: You can\'t use the same element for multiple containers')
  }
  if (node.children.length > 0) {
    console.info('deku: The container element is not empty. These elements will be removed. Read more: http://cl.ly/b0Sr')
    node.innerHTML = ''
  }
  if (node === document.body) {
    console.warn('deku: Using document.body is allowed but it can cause some issues. Read more: http://cl.ly/b0SC')
  }
  addNativeEventListeners()
  var containerId = uid()
  containers[containerId] = node
  children[containerId] = {}
  return containerId
}

/**
 * Render a vnode into a container
 *
 * @param  {HTMLElement} container
 * @param  {Object} vnode
 */

var render = curry(function (node, vnode) {
  var containerId = getContainerByNode(node) || createContainer(node)
  // var isRendering = inProgress[containerId]
  var nativeElement = nativeElements[containerId]
  var virtualElement = getVirtualElement(containerId)
  clearFrame(containerId)
  if (!nativeElement) {
    nativeElement = toNative(containerId, '0', vnode)
    node.appendChild(nativeElement)
  } else {
    if (virtualElement !== vnode) {
      nativeElement = patch(containerId, virtualElement, vnode, nativeElement)
    }
    updateChildren(containerId)
  }
  nativeElements[containerId] = nativeElement
  virtualElements[containerId] = vnode
  delete inProgress[containerId]
  flushMountQueue()
})

/**
 * Remove a component from the native dom.
 *
 * @param {Entity} entity
 */

var removeEntity = function (entityId) {
  var entity = entities[entityId]
  if (!entity) return
  var nativeElement = nativeElements[entityId]
  trigger('beforeUnmount', entity, [toComponent(entityId), nativeElement])
  unmountChildren(entityId)
  removeAllHandlers(entityId)
  delete entities[entityId]
  delete children[entityId]
  delete pendingProps[entityId]
  delete pendingState[entityId]
  delete virtualElements[entityId]
  delete nativeElements[entityId]
  delete entityProps[entityId]
  delete entityState[entityId]
}

/**
 * Update a component.
 *
 * - Commit any changes and re-render
 * - If the same virtual element is returned we skip diffing
 *
 * @param {String} entityId
 */

var updateEntity = function (entityId) {
  var entity = entities[entityId]
  var currentTree = virtualElements[entityId]
  var currentElement = nativeElements[entityId]
  var previousState = entity.state
  var previousProps = entity.props
  var shouldUpdate = shouldRender(entity)
  commitPendingChanges(entity.id)
  if (!shouldUpdate) return updateChildren(entityId)
  var nextTree = renderEntity(entity)
  if (nextTree === currentTree) return updateChildren(entityId)
  var updatedElement = patch(entityId, currentTree, nextTree, currentElement)
  virtualElements[entityId] = nextTree
  nativeElements[entityId] = updatedElement
  updateChildren(entityId)
  trigger('afterRender', entity, [toComponent(entityId), updatedElement])
  triggerUpdate('afterUpdate', entity, [toComponent(entityId), previousProps, previousState])
}

/**
 * Create a native element from a component.
 */

var toNativeComponent = function (parentId, path, vnode) {
  var entity = createEntity(path, vnode.component, parentId)
  var initialProps = defaults(vnode.props, entity.type.defaultProps)
  var initialState = entity.type.initialState ? entity.type.initialState(initialProps) : {}
  children[parentId] = {}
  children[parentId][path] = entity.id
  entityProps[entity.id] = initialProps
  entityState[entity.id] = initialState
  entities[entity.id] = entity
  commitPendingChanges(entity.id)
  var virtualElement = renderEntity(entity)
  var nativeElement = toNative(entity.id, '0', virtualElement)
  virtualElements[entity.id] = virtualElement
  nativeElements[entity.id] = nativeElement
  mountQueue.push(entity.id)
  return nativeElement
}

/**
 * Create a native element from a virtual element.
 *
 * @param {String} entityId
 * @param {String} path
 * @param {Object} vnode
 *
 * @return {HTMLDocumentFragment}
 */

var toNative = function (entityId, path, vnode) {
  switch (nodeType(vnode)) {
    case 'text':
      return document.createTextNode(vnode)
    case 'element':
      return toNativeElement(entityId, path, vnode)
    case 'component':
      return toNativeComponent(entityId, path, vnode)
  }
}

/**
 * Create a native element from a virtual element.
 */

var toNativeElement = function (entityId, path, vnode) {
  var el = createElement(vnode.type)
  el.__entity__ = entityId
  el.__path__ = path
  forEach(vnode.attributes, function (value, name) {
    setAttribute(entityId, path, el, name, value)
  })
  forEach(vnode.children, function (child, i) {
    if (child == null) return
    var childEl = toNative(entityId, path + '.' + i, child)
    if (!childEl.parentNode) el.appendChild(childEl)
  })
  return el
}

/**
 * Create a diff between two trees of nodes.
 */

var diffNode = function (entityId, path, prev, next, el) {
  var nextType = nodeType(next)
  var prevType = nodeType(prev)
  if (nextType !== prevType) {
    return replaceElement(entityId, path, el, next)
  }
  switch (nextType) {
    case 'text':
      return diffText(prev, next, el)
    case 'element':
      return diffElement(path, entityId, prev, next, el)
    case 'component':
      return diffComponent(path, entityId, prev, next, el)
  }
}

/**
 * Diff two text nodes and update the element.
 */

var diffText = function (previous, current, el) {
  if (current !== previous) el.data = current
  return el
}

/**
 * Diff the children of an ElementNode.
 */

var diffChildren = function (path, entityId, prev, next, el) {
  var positions = []
  var childNodes = Array.prototype.slice.apply(el.childNodes)
  var leftKeys = reduce(prev.children, keyMapReducer, {})
  var rightKeys = reduce(next.children, keyMapReducer, {})
  var currentChildren = assign({}, children[entityId])

  // Diff all of the nodes that have keys. This lets us re-used elements
  // instead of overriding them and lets us move them around.
  if (!isEmpty(leftKeys) && !isEmpty(rightKeys)) {

    // Removals
    forEach(leftKeys, function (leftNode, key) {
      if (rightKeys[key] == null) {
        var leftPath = path + '.' + leftNode.index
        removeElement(
          entityId,
          leftPath,
          childNodes[leftNode.index]
        )
      }
    })

    // Update nodes
    forEach(rightKeys, function (rightNode, key) {
      var leftNode = leftKeys[key]

      // We only want updates for now
      if (leftNode == null) return

      var leftPath = path + '.' + leftNode.index

      // Updated
      positions[rightNode.index] = diffNode(
        leftPath,
        entityId,
        leftNode,
        rightNode,
        childNodes[leftNode.index]
      )
    })

    // Update the positions of all child components and event handlers
    forEach(rightKeys, function (rightNode, key) {
      var leftNode = leftKeys[key]

      // We just want elements that have moved around
      if (leftNode == null || leftNode.index === rightNode.index) return

      var rightPath = path + '.' + rightNode.index
      var leftPath = path + '.' + leftNode.index

      // Update all the child component path positions to match
      // the latest positions if they've changed. This is a bit hacky.
      forEach(currentChildren, function (childId, childPath) {
        if (leftPath === childPath) {
          delete children[entityId][childPath]
          children[entityId][rightPath] = childId
        }
      })
    })

    // Now add all of the new nodes last in case their path
    // would have conflicted with one of the previous paths.
    forEach(rightKeys, function (rightNode, key) {
      var rightPath = path + '.' + rightNode.index
      if (leftKeys[key] == null) {
        positions[rightNode.index] = toNative(
          entityId,
          rightPath,
          rightNode
        )
      }
    })

  } else {
    var maxLength = Math.max(prev.children.length, next.children.length)

    // Now diff all of the nodes that don't have keys
    for (var i = 0; i < maxLength; i++) {
      var leftNode = prev.children[i]
      var rightNode = next.children[i]

      // Both null
      if (leftNode == null && rightNode == null) {
        continue
      }

      // Removals
      if (rightNode == null) {
        removeElement(
          entityId,
          path + '.' + leftNode.index,
          childNodes[leftNode.index]
        )
      }

      // New Node
      if (leftNode == null) {
        positions[rightNode.index] = toNative(
          entityId,
          path + '.' + rightNode.index,
          rightNode
        )
      }

      // Updated
      if (leftNode && rightNode) {
        positions[leftNode.index] = diffNode(
          path + '.' + leftNode.index,
          entityId,
          leftNode,
          rightNode,
          childNodes[leftNode.index]
        )
      }
    }
  }

  forEach(positions, moveElement(el))
}

/**
 * Diff the attributes and add/remove them.
 */

var diffAttributes = function (prev, next, el, entityId, path) {
  var nextAttrs = next.attributes
  var prevAttrs = prev.attributes

  // add new attrs
  forEach(nextAttrs, function (value, name) {
    if (nextAttrs == null) {
      removeAttribute(entityId, path, el, name)
    } else if (events[name] || !(name in prevAttrs) || prevAttrs[name] !== value) {
      setAttribute(entityId, path, el, name, value)
    }
  })

  // remove old attrs
  forEach(prevAttrs, function (value, name) {
    if (!(name in nextAttrs)) {
      removeAttribute(entityId, path, el, name)
    }
  })
}

/**
 * Update a component with the props from the next node. If
 * the component type has changed, we'll just remove the old one
 * and replace it with the new component.
 */

var diffComponent = function (path, entityId, prev, next, el) {
  if (next.type !== prev.type) return replaceElement(entityId, path, el, next)
  updateProps(children[entityId][path], next.attributes)
  // TODO: We could update here straight away and skip looping through children later
  return el
}

/**
 * Diff two element nodes.
 */

var diffElement = function (path, entityId, prev, next, el) {
  if (next.type !== prev.type) return replaceElement(entityId, path, el, next)
  diffAttributes(prev, next, el, entityId, path)
  diffChildren(path, entityId, prev, next, el)
  return el
}

/**
 * Removes an element from the DOM and unmounts and components
 * that are within that branch
 *
 * side effects:
 *   - removes element from the DOM
 *   - removes internal references
 *
 * @param {String} entityId
 * @param {String} path
 * @param {HTMLElement} el
 */

var removeElement = function (entityId, path, el) {
  var childrenByPath = children[entityId]
  var childId = childrenByPath[path]
  var entityHandlers = handlers[entityId] || {}
  var removals = []

  // If the path points to a component we should use that
  // components element instead, because it might have moved it.
  if (childId) {
    el = nativeElements[childId]
    removeEntity(childId)
    removals.push(path)
  } else {

    // Just remove the text node
    if (el.tagName) return el.parentNode.removeChild(el)

    // Then we need to find any components within this
    // branch and unmount them.
    forEach(childrenByPath, function (childId, childPath) {
      if (childPath === path || isWithinPath(path, childPath)) {
        removeEntity(childId)
        removals.push(childPath)
      }
    })

    // Remove all events at this path or below it
    forEach(entityHandlers, function (fn, handlerPath) {
      if (handlerPath === path || isWithinPath(path, handlerPath)) {
        removeHandler(entityId, handlerPath)
      }
    })
  }

  forEach(removals, function (path) {
    delete children[entityId][path]
  })
  el.parentNode.removeChild(el)
  returnElement(el)
}

/**
 * Replace an element in the DOM. Removing all components
 * within that element and re-rendering the new virtual node.
 *
 * @param {Entity} entity
 * @param {String} path
 * @param {HTMLElement} el
 * @param {Object} vnode
 *
 * @return {void}
 */

var replaceElement = function (entityId, path, el, vnode) {
  var parent = el.parentNode
  var index = Array.prototype.indexOf.call(parent.childNodes, el)

  // remove the previous element and all nested components. This
  // needs to happen before we create the new element so we don't
  // get clashes on the component paths.
  removeElement(entityId, path, el)

  // then add the new element in there
  var newEl = toNative(entityId, path, vnode)
  moveElement(parent, newEl, index)

  if (isRoot(path)) {
    updateEntityNativeElement(entityId, newEl)
  }

  return newEl
}

/**
 * Move a DOM element to a new index within it's parent
 */

var moveElement = curry(function (element, childEl, newPosition) {
  var target = element.childNodes[newPosition]
  if (childEl !== target) {
    if (target) {
      element.insertBefore(childEl, target)
    } else {
      element.appendChild(childEl)
    }
  }
})

/**
 * Update all entities in a branch that have the same nativeElement. This
 * happens when a component has another component as it's root node.
 *
 * @param {String} entityId
 * @param {HTMLElement} newEl
 *
 * @return {void}
 */

var updateEntityNativeElement = function (entityId, newEl) {
  var target = getEntity(entityId)
  if (!target) return
  if (children[target.ownerId]['0'] === entityId) {
    nativeElements[target.ownerId] = newEl
    updateEntityNativeElement(target.ownerId, newEl)
  }
}

/**
 * Create an event handler that can return a value to update state
 * instead of relying on side-effects.
 */

var handleEvent = curry(function (entityId, fn, e) {
  var entity = getEntity(entityId)
  if (entity) {
    var update = updateState(entityId)
    update(fn(e, toComponent(entityId), update))
  } else {
    fn(e)
  }
})

/**
 * Set the attribute of an element, performing additional transformations
 * dependning on the attribute name
 *
 * @param {HTMLElement} el
 * @param {String} name
 * @param {String} value
 */

var setAttribute = function (entityId, path, el, name, value) {
  if (events[name]) {
    addHandler(entityId, path, events[name], handleEvent(entityId, value))
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = true
      break
    case 'innerHTML':
    case 'value':
      el[name] = value
      break
    case svg.isAttribute(name):
      el.setAttributeNS(svg.namespace, name, value)
      break
    default:
      el.setAttribute(name, value)
      break
  }
}

/**
 * Remove an attribute, performing additional transformations
 * dependning on the attribute name
 *
 * @param {HTMLElement} el
 * @param {String} name
 */

var removeAttribute = function (entityId, path, el, name) {
  if (events[name]) {
    removeHandler(entityId, path, events[name])
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = false
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
 * Trigger a hook on a component.
 *
 * @param {String} name Name of hook.
 * @param {Entity} entity The component instance.
 * @param {Array} args To pass along to hook.
 */

var trigger = function (name, entity, args) {
  if (typeof entity.type[name] !== 'function') return
  return entity.type[name].apply(null, args)
}

/**
 * Trigger a hook on the component and allow state to be
 * updated too.
 *
 * @param {String} name
 * @param {Object} entity
 * @param {Array} args
 *
 * @return {void}
 */

var triggerUpdate = function (name, entity, args) {
  args.push(updateState(entity.id))
  updateState(entity.id, trigger(name, entity, args))
}

/**
 * Commit props and state changes to an entity.
 */

var commitPendingChanges = function (entityId) {
  entityState[entityId] = assign(entityState[entityId] || {}, pendingState[entityId])
  entityProps[entityId] = assign(entityProps[entityId] || {}, pendingProps[entityId])
  delete pendingState[entityId]
  delete pendingProps[entityId]
}

/**
 * Handle an event that has occured within the container
 *
 * @param {Event} event
 */

var handleNativeEvent = function (event) {
  var target = event.target
  var eventType = event.type
  while (target) {
    var fn = getHandler(target.__entity__, target.__path__, eventType)
    if (fn) {
      event.delegateTarget = target
      fn(event)
      break
    }
    target = target.parentNode
  }
}

/**
 * Render the entity and make sure it returns a node
 *
 * @param {Entity} entity
 *
 * @return {VirtualTree}
 */

var renderEntity = function (entity) {
  var render = entity.type.render
  if (!render) throw new Error('Component needs a render function')
  var result = render(toComponent(entity.id), updateState(entity.id))
  if (!result) throw new Error('Render function must return an element.')
  return result
}

/**
 * Try to avoid creating new virtual dom if possible.
 *
 * Later we may expose this so you can override, but not there yet.
 *
 * @return {Boolean}
 */

var shouldRender = function (entity) {
  if (!isDirty(entity)) return false
  var fn = entity.type.shouldRender || entity.type.shouldUpdate
  if (!fn) return true
  var nextProps = pendingProps[entity.id]
  var nextState = pendingState[entity.id]
  return fn(toComponent(entity.id), nextProps, nextState)
}

/**
 * Call hooks for all new entities that have been created in
 * the last render from the bottom up.
 */

var flushMountQueue = function () {
  while (mountQueue.length) {
    var entityId = mountQueue.pop()
    var entity = entities[entityId]
    var nativeElement = nativeElements[entityId]
    trigger('afterRender', entity, [toComponent(entity.id), nativeElement])
    triggerUpdate('afterMount', entity, [toComponent(entity.id), nativeElement, updateState(entityId)])
  }
}

/**
 * Get the entity tree for a container. This allows you to view the tree
 * of components, including their state. This could be used to create developer
 * tools or to inject props into components within the tree.
 *
 * @param {HTMLElement} container
 */

var inspectNode = curry(function (path, id) {
  var node = {
    id: id,
    path: path,
    nativeElement: nativeElements[id],
    props: entityProps[id],
    state: entityState[id],
    children: {}
  }
  for (var childPath in children[id]) {
    node.children[childPath] = inspectNode(id, children[id][childPath])
  }
  return node
})

/**
 * Render a virtual element to a DOM element container

 * (HTMLElement, VirtualElement) -> void
 */

exports.render = render

/**
 * Remove any virtual elements from a DOM element container
 *
 * (Node) -> undefined
 */

exports.remove = curry(compose(removeContainer, getContainerByNode))

/**
 * Inspect the tree of components within a DOM element container
 *
 * (HTMLElement) -> Object
 */
exports.inspect = curry(compose(inspectNode('root'), getContainerByNode))

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

},{"../shared/defaults":40,"../shared/element":41,"../shared/events":42,"../shared/path":43,"../shared/svg":44,"./pool":37,"component-raf":1,"fast.js/forEach":7,"fast.js/object/assign":10,"fast.js/reduce":13,"get-uid":14,"is-dom":15,"is-empty":16,"is-promise":17,"object-path":18,"ramda/src/compose":21,"ramda/src/curry":22,"ramda/src/mapObj":35}],37:[function(_require,module,exports){
/**
 * This module provides a way to pool DOM elements. Creating brand new DOM
 * elements can be an expensive process so we can just re-use elements that
 * have already been made.
 */

var svg = _require('../shared/svg')
var walk = _require('dom-walk')
var Pool = _require('dom-pool')
var forEach = _require('fast.js/forEach')
var statefulElements = ['input', 'textarea']
var pools = {}

exports.createElement = createElement
exports.returnElement = addToPool

function createElement (tagName) {
  if (isPoolableElement(tagName)) {
    return prepareElement(getElementPool(tagName).pop())
  }
  return createNativeElement(tagName)
}

function getElementPool (tagName) {
  var pool = pools[tagName]
  if (!pool) {
    var poolOpts = svg.isElement(tagName) ?
      { namespace: svg.namespace, tagName: tagName } :
      { tagName: tagName }
    pool = pools[tagName] = new Pool(poolOpts)
  }
  return pool
}

function createNativeElement (tagName, namespace) {
  if (svg.isElement(tagName)) {
    return document.createElementNS(svg.namespace, tagName)
  } else {
    return document.createElement(tagName)
  }
}

function prepareElement (el) {
  removeAllChildren(el)
  removeAllAttributes(el)
  return el
}

function removeAllAttributes (el) {
  forEach(el.attributes, function (attr) {
    el.removeAttribute(attr.name)
  })
}

function removeAllChildren (el) {
  while (el.firstChild) el.removeChild(el.firstChild)
}

function isPoolableElement (tagName) {
  return statefulElements.indexOf(tagName) < 0
}

function addToPool (el) {
  walk(el, function (node) {
    if (!node.tagName || !isPoolableElement(node.tagName)) return
    getElementPool(node.tagName.toLowerCase()).push(node)
  })
}

},{"../shared/svg":44,"dom-pool":3,"dom-walk":4,"fast.js/forEach":7}],38:[function(_require,module,exports){
// Client rendering
if (typeof document !== 'undefined') {
  var client = _require('./client')
  exports.render = client.render
  exports.remove = client.remove
  exports.inspect = client.inspect
}

// Server rendering
exports.renderString = _require('./server')

},{"./client":36,"./server":39}],39:[function(_require,module,exports){
var events = _require('../shared/events')
var nodeType = _require('../shared/element').nodeType
var defaults = _require('../shared/defaults')

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

},{"../shared/defaults":40,"../shared/element":41,"../shared/events":42}],40:[function(_require,module,exports){
/**
 * The npm 'defaults' module but without clone because
 * it was requiring the 'Buffer' module which is huge.
 *
 * @param {Object} options
 * @param {Object} defaults
 *
 * @return {Object}
 */

exports.defaults = function(options, defaults) {
  Object.keys(defaults).forEach(function(key) {
    if (typeof options[key] === 'undefined') {
      options[key] = defaults[key]
    }
  })
  return options
}

},{}],41:[function(_require,module,exports){
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

},{"component-type":2}],42:[function(_require,module,exports){
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

},{}],43:[function(_require,module,exports){
/**
 * These are path string helpers. We use paths like 0.2.4 when rendering
 * components within the tree. These are used to identify virtual nodes.
 */

 /**
  * Check if a path is actually the root.
  */

exports.isRoot = function (path) {
  return path === '0'
}

/**
 * Checks to see if one tree path is within
 * another tree path. Example:
 *
 * 0.1 vs 0.1.1 = true
 * 0.2 vs 0.3.5 = false
 */

exports.isWithinPath = function (parentPath, childPath) {
  return childPath.indexOf(parentPath + '.') === 0
}

},{}],44:[function(_require,module,exports){
/**
 * This file lists the supported SVG elements used by the
 * renderer. We may add better SVG support in the future
 * that doesn't require whitelisting elements.
 */

exports.namespace = 'http://www.w3.org/2000/svg'

/**
 * Supported SVG elements
 *
 * @type {Array}
 */

exports.elements = {
  'circle': true,
  'defs': true,
  'ellipse': true,
  'g': true,
  'line': true,
  'linearGradient': true,
  'mask': true,
  'path': true,
  'pattern': true,
  'polygon': true,
  'polyline': true,
  'radialGradient': true,
  'rect': true,
  'stop': true,
  'svg': true,
  'text': true,
  'tspan': true
}

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
 * Is element's namespace SVG?
 *
 * @param {String} name
 */

exports.isElement = function (name) {
  return name in exports.elements
}

/**
 * Are element's attributes SVG?
 *
 * @param {String} attr
 */

exports.isAttribute = function (attr) {
  return attr in exports.attributes
}

},{}]},{},[38])(38)
});