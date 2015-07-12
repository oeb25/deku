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
