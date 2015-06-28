/**
 * Render scenes to the DOM.
 */

if (typeof document !== 'undefined') {
  var client = require('./client')
  exports.render = client.render
  exports.remove = client.remove
  exports.inspect = client.inspect
}

/**
 * Render scenes to a string
 */

exports.renderString = require('./server')
