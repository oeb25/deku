var events = require('../shared/events')
var nodeType = require('../shared/node-type')
var defaults = require('defaults')

exports.render = render

function render (element) {
  return nodeToString(element, '0')
}

function componentToString (component, optProps) {
  var props = defaults(optProps, component.defaultProps)
  var state = component.initialState ? component.initialState(props) : {}
  var node = component.render({ props: props, state: state })
  return nodeToString(node, '0')
}

function nodeToString (node, path) {
  if (node == null) return ''
  switch (nodeType(node)) {
    case 'text':
      return node
    case 'element':
      var children = node.children
      var attributes = node.attributes
      var tagName = node.type
      var innerHTML = attributes.innerHTML
      var str = '<' + tagName + attributesToString(attributes) + '>'
      if (innerHTML) {
        str += innerHTML
      } else {
        for (var i = 0, n = children.length; i < n; i++) {
          str += nodeToString(children[i], path + '.' + i)
        }
      }
      str += '</' + tagName + '>'
      return str
    case 'component':
      return componentToString(node.type, node.props)
  }
}

function attributesToString (attributes) {
  var str = ''
  for (var key in attributes) {
    if (key === 'innerHTML') continue
    if (events[key]) continue
    str += attributeToString(key, attributes[key])
  }
  return str
}

function attributeToString (key, val) {
  return ' ' + key + '="' + val + '"'
}
