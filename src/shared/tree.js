/*

This module makes it easy to work with object trees. This is the same kind of tree
that's used for the virtual DOM and the kind that we store the rendered components in.

The only real requirement is that each node is an object and has a children
property. 

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


var curry = require('curry')

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
