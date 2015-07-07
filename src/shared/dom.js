/**
 * Move a DOM element to a new index within it's parent
 */

exports.moveElement = curry(function (element, childEl, newPosition) {
  var target = element.childNodes[newPosition]
  if (childEl !== target) {
    if (target) {
      element.insertBefore(childEl, target)
    } else {
      element.appendChild(childEl)
    }
  }
})

/**
 * Get the index of an element within it's parent
 */

exports.getElementIndex = function (el) {
  return Array.prototype.indexOf.call(el.parentNode.childNodes, el)
}
