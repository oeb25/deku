/**
 * Patch an element with the diff from two trees.
 */

var patch = function (prev, next) {
  var changes = []
  diffNode('0', prev, next, changes)
  return changes
}

/**
 * Create a diff between two trees of nodes.
 */

var diffNode = function (path, prev, next, changes) {
  if (prev === next) {
    return
  }
  var nextType = nodeType(next)
  var prevType = nodeType(prev)
  if (nextType !== prevType) {
    replaceElement(path, prev, next, changes)
    return
  }
  switch (nextType) {
    case 'text':
      return diffText(path, prev, next, changes)
    case 'element':
      return diffElement(path, prev, next, changes)
    case 'component':
      return diffComponent(path, prev, next, changes)
  }
}

/**
 * Diff two text nodes and update the element.
 */

var diffText = function (path, previous, current, changes) {
  if (current !== previous) {
    replaceText(path, current)
  }
}

/**
 * Diff the children of an ElementNode.
 */

var diffChildren = function (path, prev, next, changes) {
  var leftKeys = getElementKeys(prev.children)
  var rightKeys = getElementKeys(next.children)
  var currentChildren = assign({}, children[entityId])

  if (!isEmpty(leftKeys) && !isEmpty(rightKeys)) {
    diffKeyedChildren(path, prev, next, changes)
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
        removeNativeElement(
          entityId,
          path + '.' + leftNode.index,
          childNodes[leftNode.index]
        )
      }

      // New Node
      if (leftNode == null) {
        positions[rightNode.index] = toNative(
          containerId,
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
}

var diffKeyedChildren = function (path, prev, next, changes) {
  var positions = []

  // Removals
  forEach(leftKeys, function (leftNode, key) {
    if (rightKeys[key] == null) {
      var leftPath = path + '.' + leftNode.index
      removeNativeElement(
        entityId,
        leftPath,
        childNodes[leftNode.index]
      )
    }
  })

  // Update nodes
  forEach(rightKeys, function (rightNode, key) {
    var leftNode = leftKeys[key]
    if (leftNode == null) return
    var leftPath = path + '.' + leftNode.index
    positions[rightNode.index] = diffNode(leftPath, leftNode, rightNode, changes)
  })

  // Update the positions of all child components and event handlers
  forEach(rightKeys, function (rightNode, key) {
    var leftNode = leftKeys[key]
    if (leftNode == null || leftNode.index === rightNode.index) return
    var rightPath = path + '.' + rightNode.index
    var leftPath = path + '.' + leftNode.index
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
        containerId,
        entityId,
        rightPath,
        rightNode
      )
    }
  })

  forEach(positions, moveElement(el))
}

/**
 * Diff the attributes and add/remove them.
 */

var diffAttributes = function (path, prev, next, changes) {
  var nextAttrs = next.attributes
  var prevAttrs = prev.attributes

  // add new attrs
  forEach(nextAttrs, function (value, name) {
    if (nextAttrs == null) {
      removeAttribute(entityId, path, el, name)
    } else if (events[name] || !(name in prevAttrs) || prevAttrs[name] !== value) {
      setAttribute(containerId, entityId, path, el, name, value)
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

var diffComponent = function (path, prev, next, changes) {
  var container = getContainer(containerId)
  if (next.type !== prev.type) return replaceElement(path, prev, next, changes)
  updateProps(container.children[entityId][path], next.attributes)
  // TODO: We could update here straight away and skip looping through children later
  return changes
}

/**
 * Diff two element nodes.
 */

var diffElement = function (path, prev, next, changes) {
  if (next.type !== prev.type) return replaceElement(path, prev, next, changes)
  diffAttributes(path, prev, next, changes)
  diffChildren(path, prev, next, changes)
  return changes
}

/**
 * Replace an element
 */

function replaceElement (path, prev, next, changes) {
  changes.push({
    type: 'replace',
    left: prev,
    right: next,
    path: path
  })
  return changes
}

/**
 * Add a text change
 */

function replaceText (path, current) {
  changes.push({
    type: 'text',
    value: current,
    path: path
  })
  return changes
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
