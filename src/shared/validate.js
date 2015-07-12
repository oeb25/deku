/**
 * Validate a component definition
 */

module.exports = function (component) {
  var name = component.name || 'Unnamed'
  if (typeof component.render !== 'function') {
    throw new Error(name + ' component needs a render function')
  }
}
