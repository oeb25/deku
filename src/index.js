// Client rendering
if (typeof document !== 'undefined') {
  var client = require('./client')
  exports.render = client.render
  exports.remove = client.remove
  exports.inspect = client.inspect
}

// Server rendering
exports.renderString = require('./server')
