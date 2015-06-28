/**
 * Render scenes to the DOM.
 */

if (typeof document !== 'undefined') {
  var client = require('./client')
  exports.render = client.render
  exports.remove = client.remove
  exports.view = client.view
}

/**
 * Render scenes to a string
 */

exports.renderString = require('./server')
