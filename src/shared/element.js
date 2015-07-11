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
