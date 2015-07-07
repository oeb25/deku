var type = require('component-type')

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

/**
 * Group an array of virtual nodes using their keys
 */

exports.getElementKeys = function (arr) {
  return arr.reduce(prev.children, function (acc, child) {
    if (child && child.key != null) acc[child.key] = child
    return acc
  }, {})
}
