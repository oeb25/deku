// Client rendering
if (typeof document !== 'undefined') {
  var client = require('./client')
  exports.render = client.render
  exports.remove = client.remove
  exports.view = client.view
}

// Server rendering
exports.renderString = require('./server')

// Export for convenience
exports.dom =
exports.element = require('virtual-element')
