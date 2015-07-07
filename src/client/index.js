var raf = require('component-raf')
var isDom = require('is-dom')
var uid = require('get-uid')
var defaults = require('../shared/defaults')
var forEach = require('fast.js/forEach')
var assign = require('fast.js/object/assign')
var reduce = require('fast.js/reduce')
var isPromise = require('is-promise')
var isEmpty = require('is-empty')
var svg = require('../shared/svg')
var events = require('../shared/events')
var keypath = require('object-path')

/**
 * Virtual element functions
 */

var elementHelpers = require('../shared/element')
var nodeType = elementHelpers.nodeType
var getElementKeys = elementHelpers.getElementKeys

/**
 * DOM pooling
 */

var pool = require('./pool')
var createElement = pool.createElement
var returnElement = pool.returnElement

/**
 * DOM functions
 */

var dom = require('../shared/dom')
var moveElement = dom.moveElement
var getElementIndex = dom.getElementIndex

/**
 * Path functions
 */

var pathHelpers = require('../shared/path')
var isRoot = pathHelpers.isRoot
var isWithinPath = pathHelpers.isWithinPath

/**
 * Functional helpers
 */

var functional = require('../shared/functional')
var curry = require('curry')
var compose = require('compose-function')
var mapObj = functional.mapObj
var map = functional.map
var prop = functional.prop

/**
 * Internal state
 */

var containers = {}
var frames = {}
var nativeHandlers = {}
var entities = {}

/**
 * Get a container DOM node using the reference id.
 */

var getContainerById = function (id) {
  return containers[id]
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
 * Update all the children of an entity.
 *
 * (ContainerId) -> void
 */

var updateChildren = function (container, entityId) {
  mapObj(updateEntity, container.children[entityId])
}

/**
 * Tell the container it's dirty and needs to re-render.
 */

var scheduleFrame = function (containerId) {
  frames[containerId] = raf(function () {
    render(getContainer(containerId), getVirtualElement(containerId))
  })
}

/**
 * Clear the current scheduled frame
 */

var clearFrame = function (containerId) {
  var frameId = frames[containerId]
  if (frameId) {
    raf.cancel(frameId)
    delete frames[containerId]
  }
  return containerId
}

/**
 * Update the entity state using a promise
 */

var updateState = function (container, entityId, nextState) {
  if (!nextState) return
  if (isPromise(nextState)) return nextState.then(updateState(entityId))
  container.pendingState[entityId] = assign(container.pendingState[entityId] || {}, nextState)
  invalidate(container)
}

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * (EntityId, nextProps) -> void
 */

var updateProps = function (container, entityId, nextProps) {
  container.pendingProps[entityId] = nextProps
  invalidate(container)
}

/**
 * Invalidate the container for an entity
 * (Container) -> void
 */

var invalidate = compose(scheduleFrame, clearFrame)

/**
 * Add all of the DOM event listeners
 */

var addNativeEventListeners = function (container) {
  var handler = nativeHandlers[container.id]
  if (handler) return
  handler = nativeHandlers[container.id] = handleNativeEvent(container)
  forEach(events, function (eventType) {
    document.body.addEventListener(eventType, handler, true)
  })
}

/**
 * Add all of the DOM event listeners
 */

var removeNativeEventListeners = function (container) {
  var handler = nativeHandlers[container.id]
  if (!handler) return
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

/**
 * Is an entity dirty and in need of a re-render?
 *
 * @param {Object} entity
 *
 * @return {Boolean}
 */

var isDirty = curry(function (container, entityId) {
  return entityId in container.pendingProps || entityId in container.pendingState
})

/**
 * Get the component state
 *
 * @param {Object} entity
 *
 * @return {Object}
 */

var toComponent = function (entityId) {
  return {
    id: entityId,
    props: entityProps[entityId],
    state: entityState[entityId]
  }
}

/**
 * Remove a container
 */

var removeContainer = function (container) {
  if (!container) return
  clearFrame(containerId)
  removeNativeEventListeners(containerId)
  removeNativeElement(container, 'root', '0', container.nativeElement)
  delete containers[containerId]
}

/**
 * Create a new container given an element
 */

var createContainer = function (node) {
  if (!isDom(node)) {
    throw new TypeError('deku: Container element must be a DOM element')
  }
  if (getContainerByNode(node)) {
    throw new Error('deku: You can\'t use the same element for multiple containers')
  }
  if (node.children.length > 0) {
    console.info('deku: The container element is not empty. These elements will be removed. Read more: http://cl.ly/b0Sr')
    node.innerHTML = ''
  }
  if (node === document.body) {
    console.warn('deku: Using document.body is allowed but it can cause some issues. Read more: http://cl.ly/b0SC')
  }
  return {
    id: uid(),
    node: node,
    children: {},
    handlers: {},
    nativeElements: {},
    virtualElements: {},
    entities: {},
    props: {},
    state: {},
    pendingProps: {},
    pendingState: {}
  }
}

/**
 * A component instance.
 */

var createEntity = function (path, type, ownerId) {
  return {
    id: uid(),
    type: type,
    path: path,
    ownerId: ownerId
  }
}

/**
 * Render a vnode into a container
 */

var render = curry(function (node, vnode) {
  var container = getContainerByNode(node)

  if (!container) {
    container = createContainer(node)
    addNativeEventListeners(container)
    containers[container.id] = container
  }

  var nativeElement = container.nativeElement
  var virtualElement = container.virtualElement

  clearFrame(container.id)

  if (!nativeElement) {
    container.nativeElement = toNative(containerId, 'root', '0', vnode)
    node.appendChild(container.nativeElement)
  } else {
    if (virtualElement !== vnode) {
      container.nativeElement = patch(container.id, virtualElement, vnode, nativeElement)
    }
    updateChildren(container.id, 'root')
  }

  flushMountQueue()
  return container
})

/**
 * Remove a component from the native dom.
 */

var removeEntity = function (container, entityId) {
  var entity = container.entities[entityId]
  if (!entity) return
  var nativeElement = container.nativeElements[entityId]
  trigger('beforeUnmount', entity, [toComponent(entityId), nativeElement])
  unmountChildren(container, entityId)
  removeAllHandlers(container, entityId)
  delete entities[entityId]
  delete children[entityId]
  delete pendingProps[entityId]
  delete pendingState[entityId]
  delete virtualElements[entityId]
  delete nativeElements[entityId]
  delete entityProps[entityId]
  delete entityState[entityId]
}

/**
 * Update a component instance.
 *
 * - Commit any changes and re-render
 * - If the same virtual element is returned we skip diffing
 */

var updateEntity = function (entityId) {
  var entity = entities[entityId]
  var currentTree = virtualElements[entityId]
  var currentElement = nativeElements[entityId]
  var previousState = entity.state
  var previousProps = entity.props
  commitPendingChanges(entityId)
  if (!shouldRender(entity)) return updateChildren(entityId)
  var nextTree = renderEntity(entity)
  if (nextTree === currentTree) return updateChildren(entityId)
  var updatedElement = patch(entityId, currentTree, nextTree, currentElement)
  virtualElements[entityId] = nextTree
  nativeElements[entityId] = updatedElement
  updateChildren(entityId)
  trigger('afterRender', entity, [toComponent(entityId), updatedElement])
  triggerUpdate('afterUpdate', entity, [toComponent(entityId), previousProps, previousState])
}

/**
 * Creates a component instance (entity) from a virtual element.
 */

var toNativeComponent = function (containerId, parentId, path, vnode) {
  var component = vnode.type
  var entity = createEntity(path, component, parentId)
  var initialProps = defaults(vnode.attributes, component.defaultProps)
  var initialState = component.initialState ? component.initialState(initialProps) : {}
  container.children[parentId] = children[parentId] || {}
  container.children[parentId][path] = entity.id
  container.props[entity.id] = initialProps
  container.state[entity.id] = initialState
  container.entities[entity.id] = entity
  commitPendingChanges(entity.id)
  var virtualElement = renderEntity(entity)
  var nativeElement = toNative(containerId, entity.id, '0', virtualElement)
  virtualElements[entity.id] = virtualElement
  nativeElements[entity.id] = nativeElement
  mountQueue.push(entity.id)
  return nativeElement
}

/**
 * Create a native element from a virtual element.
 */

var toNative = function (containerId, entityId, path, vnode) {
  switch (nodeType(vnode)) {
    case 'text':
      return document.createTextNode(vnode)
    case 'element':
      return toNativeElement(containerId, entityId, path, vnode)
    case 'component':
      return toNativeComponent(containerId, entityId, path, vnode)
  }
}

/**
 * Create a native element from a virtual element.
 */

var toNativeElement = function (containerId, entityId, path, vnode) {
  var el = createElement(vnode.type)
  el.__entity__ = entityId
  el.__path__ = path
  forEach(vnode.attributes, setAttribute(containerId, entityId, path, el))
  forEach(vnode.children, function (child, i) {
    if (child == null) return
    var childEl = toNative(containerId, entityId, path + '.' + i, child)
    if (!childEl.parentNode) el.appendChild(childEl)
  })
  return el
}

/**
 * Removes an element from the DOM and unmounts and components
 * that are within that branch
 *
 * side effects:
 *   - removes element from the DOM
 *   - removes internal references
 */

var removeNativeElement = function (containerId, entityId, path, el) {
  var childrenByPath = children[entityId] || {}
  var childId = childrenByPath[path]
  var entityHandlers = handlers[entityId] || {}
  var container = getContainer(containerId)
  var removals = []

  // If the path points to a component we should use that
  // components element instead, because it might have moved it.
  if (childId) {
    el = nativeElements[childId]
    removeEntity(containerId, childId)
    removals.push(path)
  } else {

    // Just remove the text node
    if (el.tagName) return el.parentNode.removeChild(el)

    // Then we need to find any components within this
    // branch and unmount them.
    forEach(childrenByPath, function (childId, childPath) {
      if (childPath === path || isWithinPath(path, childPath)) {
        removeEntity(containerId, childId)
        removals.push(childPath)
      }
    })

    // Remove all events at this path or below it
    forEach(entityHandlers, function (fn, handlerPath) {
      if (handlerPath === path || isWithinPath(path, handlerPath)) {
        removeHandler(containerId, entityId, handlerPath)
      }
    })
  }

  forEach(removals, function (path) {
    delete container.children[entityId][path]
  })

  el.parentNode.removeChild(el)
  returnElement(el)
}

/**
 * Replace an element in the DOM. Removing all components
 * within that element and re-rendering the new virtual node.
 */

var replaceElement = function (containerId, entityId, path, el, vnode) {
  // remove the previous element and all nested components. This
  // needs to happen before we create the new element so we don't
  // get clashes on the component paths.
  removeNativeElement(containerId, entityId, path, el)

  // then add the new element in there
  var newEl = toNative(containerId, entityId, path, vnode)
  moveElement(parent, newEl, getElementIndex(el))

  if (isRoot(path)) {
    updateEntityNativeElement(containerId, entityId, newEl)
  }

  return newEl
}

/**
 * Update all entities in a branch that have the same nativeElement. This
 * happens when a component has another component as it's root node.
 */

var updateEntityNativeElement = function (entityId, newEl) {
  var target = getEntity(entityId)
  if (!target) return
  if (children[target.ownerId]['0'] === entityId) {
    nativeElements[target.ownerId] = newEl
    updateEntityNativeElement(target.ownerId, newEl)
  }
}

/**
 * Create an event handler that can return a value to update state
 * instead of relying on side-effects.
 */

var handleEvent = curry(function (entityId, fn, e) {
  var entity = getEntity(entityId)
  if (entity) {
    var update = updateState(entityId)
    update(fn(e, toComponent(entityId), update))
  } else {
    fn(e)
  }
})

/**
 * Set the attribute of an element, performing additional transformations
 * dependning on the attribute name
 */

var setAttribute = function (containerId, entityId, path, el, value, name) {
  if (events[name]) {
    addHandler(containerId, events[name], entityId, path, handleEvent(entityId, value))
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = true
      break
    case 'innerHTML':
    case 'value':
      el[name] = value
      break
    case svg.isAttribute(name):
      el.setAttributeNS(svg.namespace, name, value)
      break
    default:
      el.setAttribute(name, value)
      break
  }
}

/**
 * Remove an attribute, performing additional transformations
 * depending on the attribute name
 */

var removeAttribute = function (containerId, entityId, path, el, name) {
  if (events[name]) {
    removeHandler(containerId, events[name], entityId, path)
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = false
      break
    case 'innerHTML':
    case 'value':
      el[name] = ''
      break
    default:
      el.removeAttribute(name)
      break
  }
}

/**
 * Trigger a hook on a component.
 */

var trigger = function (name, entity, args) {
  if (typeof entity.type[name] !== 'function') return
  return entity.type[name].apply(null, args)
}

/**
 * Trigger a hook on the component and allow state to be
 * updated too.
 */

var triggerUpdate = function (name, entity, args) {
  args.push(updateState(entity.id))
  updateState(entity.id, trigger(name, entity, args))
}

/**
 * Commit props and state changes to an entity.
 */

var commitPendingChanges = function (entityId) {
  entityState[entityId] = assign(entityState[entityId] || {}, pendingState[entityId] || {})
  entityProps[entityId] = assign(entityProps[entityId] || {}, pendingProps[entityId] || {})
  delete pendingState[entityId]
  delete pendingProps[entityId]
}

/**
 * Handle an event that has occured within the container
 *
 * @param {Event} event
 */

var handleNativeEvent = curry(function (containerId, event) {
  var target = event.target
  var handler = getHandler(containerId, event.type)

  while (target) {
    var fn = handler(target.__entity__, target.__path__)
    if (fn) {
      event.delegateTarget = target
      fn(event)
      break
    }
    target = target.parentNode
  }
})

/**
 * Render the entity and make sure it returns a virtual element
 */

var renderEntity = function (entity) {
  var component = entity.type
  validateComponent(component)
  var result = component.render(toComponent(entity.id), updateState(entity.id))
  if (!result) throw new Error('Render function must return an element.')
  return result
}

/**
 * Validate a component definition
 */

var validateComponent = function (component) {
  var name = component.name || 'Unnamed'
  if (typeof component.render !== 'function') throw new Error(name + ' component needs a render function')
}

/**
 * Try to avoid creating new virtual dom if possible.
 *
 * Later we may expose this so you can override, but not there yet.
 *
 * @return {Boolean}
 */

var shouldRender = function (entity) {
  if (!isDirty(entity)) return false
  var fn = entity.type.shouldRender || entity.type.shouldUpdate
  if (!fn) return true
  var nextProps = pendingProps[entity.id]
  var nextState = pendingState[entity.id]
  return fn(toComponent(entity.id), nextProps, nextState)
}

/**
 * Call hooks for all new entities that have been created in
 * the last render from the bottom up.
 */

var flushMountQueue = function () {
  while (mountQueue.length) {
    var entityId = mountQueue.pop()
    var entity = entities[entityId]
    var nativeElement = nativeElements[entityId]
    trigger('afterRender', entity, [toComponent(entity.id), nativeElement])
    triggerUpdate('afterMount', entity, [toComponent(entity.id), nativeElement, updateState(entityId)])
  }
}

/**
 * Remove all of the child entities of an entity
 */

var unmountChildren = function (container, entityId) {
  mapObj(removeEntity, container.children[entitiyId])
}

/**
 * Render a virtual element to a DOM element container

 * (HTMLElement, VirtualElement) -> void
 */

exports.render = render

/**
 * Remove any virtual elements from a DOM element container
 *
 * (Node) -> undefined
 */

exports.remove = curry(compose(removeContainer, getContainerByNode))

/**
 * Inspect the tree of components within a DOM element container
 *
 * (HTMLElement) -> Object
 */

// exports.inspect = curry(compose(inspectNode('root'), getContainerByNode))

/**
 * Update the state of an entity.
 *
 * (EntityId, Object) -> void
 */

exports.updateState = updateState

/**
 * Update the props of an entity
 *
 * (EntityId, Object) -> void
 */

exports.updateProps = updateProps
