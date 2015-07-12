/*

Containers are singleton objects for DOM nodes that we can render virtual
elements into. This is an optimization so that when a new virtual element
is rendered to the same DOM element we can just perform an update instead
of blowing everything away. Hiding this implementation from the user means
they don't need to worry about how it works, they can just render whenever
they want and this is kept as an implementation detail.

*/

var isDom = require('is-dom')
var Map = require('ez-map')
var containers = new Map() // This could be a WeakMap

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
