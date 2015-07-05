var curry = require('curry')

exports.mapObj = curry(function (fn, obj) {
  return Object.keys(obj).reduce(function (acc, key) {
    acc[key] = fn(obj[key])
    return acc
  }, {})
})

exports.map = curry(function (fn, arr) {
  return arr.map(fn)
})
