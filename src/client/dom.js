/**
 * Move a DOM element to a new index within it's parent
 */

exports.insertAt = function (element, newPosition, childEl) {
  var target = element.childNodes[newPosition]
  if (childEl !== target) {
    if (target) {
      element.insertBefore(childEl, target)
    } else {
      element.appendChild(childEl)
    }
  }
}

/**
 * Find an element using a index path, eg. 0.1.4
 */

exports.getElementByPath = function (path, parent) {
  var parts = path.split('.')
  var node = parent
  while (parts.length) {
    var index = parts.shift()
    if (index) node = node.children[index]
  }
  return node
}
