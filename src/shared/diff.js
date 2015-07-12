var nodeType = require('./element').nodeType
var isEmpty = require('is-empty')

module.exports = function (prev, next) {
  var changes = [] // This is mutated
  diffNode('0', prev, next, changes)
  return changes
}

var diffNode = function (path, prev, next, changes) {
  if (prev === next) return
  var nextType = nodeType(next)
  var prevType = nodeType(prev)
  if (nextType !== prevType) {
    replaceElement(path, prev, next, changes)
    return
  }
  switch (nextType) {
    case 'text':
      diffText(path, prev, next, changes)
    case 'element':
      diffElement(path, prev, next, changes)
    case 'component':
      diffComponent(path, prev, next, changes)
  }
}

var diffText = function (path, previousValue, newValue, changes) {
  if (current !== previousValue) {
    replaceText(path, newValue)
  }
}

var diffChildren = function (path, prev, next, changes) {
  var leftKeys = groupElementsByKey(prev.children)
  var rightKeys = groupElementsByKey(next.children)
  var maxLength = Math.max(prev.children.length, next.children.length)
  // Key diffing
  if (!isEmpty(leftKeys) && !isEmpty(rightKeys)) {
    diffKeyedChildren(path, leftKeys, rightKeys, changes)
    return
  }
  // Regular diffing
  for (var i = 0; i < maxLength; i++) {
    var leftNode = prev.children[i]
    var rightNode = next.children[i]
    // Both null
    if (leftNode == null && rightNode == null) {
      continue
    }
    // Removed node
    if (rightNode == null) {
      removeElement(path + '.' + leftNode.index, changes)
      continue
    }
    // New node
    if (leftNode == null) {
      insertElement(path + '.' + rightNode.index, rightNode, changes)
      continue
    }
    // Updated node
    diffNode(path + '.' + leftNode.index, leftNode, rightNode, changes)
  }
}

var diffKeyedChildren = function (path, leftKeys, rightKeys, changes) {
  // Removals
  forEach(leftKeys, function (leftNode, key) {
    if (rightKeys[key] == null) {
      removeElement(path + '.' + leftNode.index, changes)
    }
  })
  // Update nodes
  forEach(rightKeys, function (rightNode, key) {
    var leftNode = leftKeys[key]
    if (leftNode == null) {
      insertElement(rightPath, rightNode, changes)
      return
    }
    var leftPath = path + '.' + leftNode.index
    var rightPath = path + '.' + rightNode.index
    diffNode(leftPath, leftNode, rightNode, changes)
    if (leftPath !== rightPath) {
      moveElement(leftPath, rightPath, changes)
    }
  })
}

var diffAttributes = function (path, prev, next, changes) {
  var nextAttrs = next.attributes
  var prevAttrs = prev.attributes
  forEach(nextAttrs, function (value, name) {
    if (nextAttrs == null) {
      removeAttribute(path, name, changes)
    } else if (events[name] || !(name in prevAttrs) || prevAttrs[name] !== value) {
      setAttribute(path, name, value, changes)
    }
  })
  forEach(prevAttrs, function (value, name) {
    if (!(name in nextAttrs)) {
      removeAttribute(path, name, changes)
    }
  })
}

var diffComponent = function (path, prev, next, changes) {
  if (next.type !== prev.type) return replaceElement(path, prev, next, changes)
  updateProps(path, next.attributes, changes)
}

var diffElement = function (path, prev, next, changes) {
  if (next.type !== prev.type) return replaceElement(path, prev, next, changes)
  diffAttributes(path, prev, next, changes)
  diffChildren(path, prev, next, changes)
}

/**
 * These functions add different types of patches
 */

function insertElement (path, next, changes) {
  changes.push({
    type: 'insertElement',
    previousElement: null,
    nextElement: next,
    textContent: null,
    path: path,
    attribute: null,
    value: null
  })
}

function removeElement (path, changes) {
  changes.push({
    type: 'removeElement',
    previousElement: null,
    nextElement: null,
    textContent: null,
    path: path,
    attribute: null,
    value: null
  })
}

function moveElement (previousPath, path, changes) {
  changes.push({
    type: 'moveElement',
    previousElement: null,
    nextElement: null,
    textContent: null,
    path: path,
    attribute: null,
    value: null,
    previousPath: previousPath
  })
}

function replaceElement (path, prev, next, changes) {
  changes.push({
    type: 'replaceElement',
    previousElement: prev,
    nextElement: next,
    textContent: null,
    path: path,
    attribute: null,
    value: null,
    previousPath: null
  })
}

function replaceText (path, current, changes) {
  changes.push({
    type: 'replaceText',
    previousElement: null,
    nextElement: null,
    textContent: current,
    path: path,
    attribute: null,
    value: null,
    previousPath: null
  })
}

function setAttribute (path, name, value, changes) {
  changes.push({
    type: 'setAttribute',
    previousElement: null,
    nextElement: null,
    textContent: null,
    path: path,
    attribute: name,
    value: value,
    previousPath: null
  })
}

function removeAttribute (path, name, changes) {
  changes.push({
    type: 'removeAttribute',
    previousElement: null,
    nextElement: null,
    textContent: null,
    path: path,
    attribute: name,
    value: null,
    previousPath: null
  })
}

function updateProps (path, props, changes) {
  changes.push({
    type: 'updateProps',
    previousElement: null,
    nextElement: null,
    textContent: null,
    path: path,
    attribute: null,
    value: props,
    previousPath: null
  })
}

/**
 * Group an array of virtual nodes using their keys
 */

var groupElementsByKey = function (arr) {
  return arr.reduce(function (acc, child) {
    if (child && child.key != null) acc[child.key] = child
    return acc
  }, {})
}
