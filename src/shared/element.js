var type = require('component-type')

/**
 * Returns the type of a virtual node. The virtual-element component is agnostic
 * to the type you set for the node. To render these virtual elements we need
 * to know which ones are components and which represent real DOM elements.
 *
 * @param  {Object} vnode
 * @return {String}
 */

exports.nodeType = function (vnode) {
  if (type(vnode) === 'string') return 'text'
  if (type(vnode.type) === 'string') return 'element'
  return 'component'
}
