var curry = require('curry')

/**
 * Map over an object. The order of the parameters and the fact it is curried
 * lets us easily compose functions in a point-free way.
 *
 * Example:
 *
 * var updateChildren = compose(mapObj(updateEntity), getChildren)
 */

exports.mapObj = curry(function (fn, obj) {
  return Object.keys(obj).reduce(function (acc, key) {
    acc[key] = fn(obj[key])
    return acc
  }, {})
})

/**
 * Map over an array. The parameters are reversed and curried for composition
 */

exports.map = curry(function (fn, arr) {
  return arr.map(fn)
})

/**
 * Get a property on an object
 */

exports.prop = curry(function (name, obj) {
  return obj[name]
})
