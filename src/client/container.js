var isDom = require('is-dom')

/**
 * Internal state
 */

var containers = {}
var nativeHandlers = {}

/**
 * Get a container for a given DOM node
 */

exports.getContainer = function (node) {
  return getContainerByNode(node) || createContainer(node)
}

/**
 * Get the container ID given an element
 */

var getContainerByNode = function (node) {
  for (var id in containers) {
    if (containers[id].node === node) return id
  }
}

/**
 * Unmount a container
 */

var unmount = function (container) {
  removeNativeEventListeners(container)
  delete containers[container.id]
}

/**
 * Create a new container given an element
 */

var createContainer = function (node) {
  if (!isDom(node)) {
    throw new TypeError('deku: Container element must be a DOM element')
  }
  if (node.children.length > 0) {
    console.info('deku: The container element is not empty. These elements will be removed. Read more: http://cl.ly/b0Sr')
    node.innerHTML = ''
  }
  if (node === document.body) {
    console.warn('deku: Using document.body is allowed but it can cause some issues. Read more: http://cl.ly/b0SC')
  }
  var container = {
    id: uid(),
    node: node,
    handlers: {},
    children: {}
  }
  containers[container.id] = container
  addNativeEventListeners(container)
  return container
}

/**
 * Add all of the DOM event listeners
 */

var addNativeEventListeners = function (container) {
  forEach(events, function (eventType) {
    document.body.addEventListener(eventType, handler, true)
  })
}

/**
 * Add all of the DOM event listeners
 */

var removeNativeEventListeners = function (container) {
  forEach(events, function (eventType) {
    document.body.removeEventListener(eventType, handler, true)
  })
}

/**
 * Get a handler for an entity
 */

var getHandler = function (container, eventType, entityId, path) {
  keypath.get(container.handlers, [entityId, path, eventType])
}

/**
 * Add an event handler for an entity at a path
 */

var addHandler = function (container, eventType, entityId, path, fn) {
  keypath.set(container.handlers, [entityId, path, eventType], fn)
}

/**
 * Remove a single event handler for an entity
 */

var removeHandler = curry(function (containerId, eventType, entityId, path) {
  var container = getContainer(containerId)
  var args = [entityId]
  if (path) args.push(path)
  if (eventType) args.push(eventType)
  keypath.del(container.handlers, args)
})

/**
 * Remove all event handlers for an entity
 */

var removeAllHandlers = curry(function (containerId, entityId) {
  var container = getContainer(containerId)
  keypath.del(container.handlers, [entityId])
})
