var tree = require('../shared/tree')
var uid = require('get-uid')
var defaults = require('object-defaults')
var isPromise = require('is-promise')
var events = require('../shared/events')
var diff = require('../shared/diff')
var isSVGAttribute = require('is-svg-attribute')
var isSVGElement = require('is-svg-element').isElement
var frame = require('./frame')
var handler = require('./handler')
var dom = require('./dom')
var containers = require('./container')
var svgNamespace = 'http://www.w3.org/2000/svg'
var elementHelpers = require('../shared/element')
var validateComponent = require('../shared/validate')
var curry = require('ramda/src/curry')
var prop = require('ramda/src/prop')
var mapObj = require('ramda/src/mapObj')
var pipe = require('ramda/src/pipe')
var forEach = require('fast.js/forEach')
var assign = require('fast.js/object/assign')
var indexOf = require('fast.js/array/indexOf')
var reduce = require('fast.js/reduce')
var nodeType = elementHelpers.nodeType
var mountQueue = []

/**
 * Entity Functions
 * ============================================================================
 */

 /**
  * Creates a component instance (entity) from a virtual element.
  */

var createEntity = function (container, parent, path, vnode) {
  var component = getComponent(vnode)
  var props = defaults(vnode.attributes, component.defaultProps)
  var state = component.initialState ? component.initialState(props) : {}
  var entity = {
    id: uid(),
    type: component,
    path: path,
    owner: parent,
    containerId: container.id,
    props: props,
    state: state,
    virtualElement: null,
    nativeElement: null,
    pendingState: null,
    pendingProps: null,
    children: {}
  }
  entity.updateState = updateState(container, entity)
  entity.updateProps = updateProps(container, entity)
  var virtualElement = renderEntity(entity)
  var nativeElement = renderElement(container, entity, '0', virtualElement)
  entity.virtualElement = virtualElement
  entity.nativeElement = nativeElement
  return entity
}

/**
 * Render an entity to get the new virtual node
 */

var renderEntity = function (entity) {
  var component = entity.type
  var result = component.render(entity, entity.updateState)
  if (!result) throw new TypeError('Render function must return an element.')
  return result
}

/**
 * Update a component instance.
 */

var updateEntity = function (entity) {
  var virtualElement = entity.virtualElement
  var nativeElement = entity.nativeElement
  var previousState = entity.state
  var previousProps = entity.props
  commitEntity(entity)
  if (!shouldRender(entity)) return updateChildren(entity)
  var nextElement = renderEntity(entity)
  if (nextElement === virtualElement) return updateChildren(entity)
  entity.nativeElement = patchNativeElement(entity, virtualElement, nextElement, nativeElement)
  entity.virtualElement = nextElement
  updateChildren(entity)
  trigger('afterRender', entity, [entity, updatedElement])
  trigger('afterUpdate', entity, [entity, previousProps, previousState])
}

/**
 * Commit props and state changes to an entity.
 */

var commitEntity = function (entity) {
  entity.state = merge(entity.state, entity.pendingState)
  entity.props = merge(entity.props, entity.pendingProps)
  delete entity.pendingState
  delete entity.pendingProps
}

/**
 * Remove an entity and all it's children from the entity tree
 */

var removeEntity = function (entity) {
  trigger('beforeUnmount', entity, [entity])
  removeEntityHandlers(child)
  removeEntityNativeElement(child)
}

/**
 * Remove all event handlers an entity
 */

var removeEntityHandlers = function (entity, path) {
  var args = [entity.id]
  if (path) args.concat(path)
  handler.remove(args)
}

/**
 * Remove all event handlers an entity
 */

var removeEntityNativeElement = function (entity) {
  if (!entity.nativeElement || !entity.nativeElement.parentNode) return
  entity.nativeElement.parentNode.removeChild(entity.nativeElement)
}

/**
 * Check to see if an entity needs a render
 */

var shouldRender = function (entity) {
  if (!isDirty(entity)) return false
  var fn = entity.type.shouldRender || entity.type.shouldUpdate
  if (!fn) return true
  return fn(entity, entity.pendingProps, entity.pendingState)
}

/**
 * Is an entity dirty and in need of a re-render?
 *
 * @param {Object} entity
 *
 * @return {Boolean}
 */

var isDirty = function (entity) {
  return entity.pendingProps || entity.pendingState
}

/**
 * Trigger a hook on a component.
 */

var trigger = function (name, entity, args) {
  if (!entity.type) return
  var fn = entity.type[name]
  if (!fn) return
  return fn(args)
}

/**
 * Update all the children of an entity.
 *
 * (Entity) -> void
 */

var updateChildren = pipe(
  prop('children'),
  mapObj(updateEntity)
)

/**
 * Remove all of the child entities of an entity
 * (Entity) -> void
 */

var removeChildren = pipe(
  prop('children'),
  mapObj(removeEntity)
)

/**
 * Entity Tree Function
 * ============================================================================
 */

/**
 * Update all entities in a branch that have the same nativeElement. This
 * happens when a component has another component as it's root node.
 */

var updateEntityNativeElement = function (entity, newEl) {
  if (!entity) return
  if (entity.owner.children['0'] === entity) {
    entity.owner.nativeElement = newEl
    updateEntityNativeElement(entity.parent, newEl)
  }
}

/**
 * Remove all entities from a path
 */

var removeNestedEntities = function (entity, path) {
  entity.children = reduce(entity.children, function (acc, child, childPath) {
    if (isWithinPath(path, childPath)) {
      acc[childPath] = child
    } else {
      removeEntity(child)
    }
  }, {})
}

/**
 * Checks to see if one tree path is within
 * another tree path. Example:
 *
 * 0.1 vs 0.1.1 = true
 * 0.2 vs 0.3.5 = false
 */

var isWithinPath = function (parentPath, childPath) {
  return childPath.indexOf(parentPath + '.') === 0
}

/**
 * Virtual Tree Functions
 * ============================================================================
 */

/**
 * Replace a virtual element with another virtual element within an entity.
 * This could be any type of node within the virtual DOM tree.
 */

var replaceElement = function (container, entity, path, previousElement, nextElement) {
  removeNestedEntities(entity, path)
  removeEntityHandlers(entity, path)

  var targetNativeElement = dom.getElementByPath(path, el)
  var newEl = renderElement(container, entity, path, vnode)
  insertElement(newEl, indexOf(el, el.parentNode.children), parent)
  updateEntityNativeElement(container, entity, newEl)
  return newEl
}

/**
 * Insert an entity into the entity tree
 */

var insertElement = function (container, entity, path, nativeElement, virtualElement) {
  var el = renderElement(container, entity, path, virtualElement)
  var index = path.split('.').pop()
  insertAt(el, index, nativeElement)
}

/**
 * Move an element to a new position.
 */

var moveElement = curry(function (entity, parentElement, position) {

})

/**
 * Create a native element from a virtual element.
 */

var renderElement = function (container, parentEntity, path, vnode) {
  switch (nodeType(vnode)) {
    case 'text':
      return document.createTextNode(vnode)
    case 'element':
      return toNativeElement(container, parentEntity, path, vnode)
    case 'component':
      var child = createEntity(container, parentEntity, path, vnode)
      if (parentEntity) {
        parentEntity.children[path] = child
      } else {
        container.children[path] = child
      }
      mountQueue.push(child)
      return child.nativeElement
  }
}

/**
 * State control
 * ============================================================================
 */

/**
 * Update the entity state using a promise
 */

var updateState = curry(function (container, entity, nextState) {
  if (!nextState) return
  if (isPromise(nextState)) return nextState.then(updateState(container, entity))
  entity.pendingState = merge(entity.pendingState, nextState)
  invalidate(container)
})

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * (EntityId, nextProps) -> void
 */

var updateProps = curry(function (container, entity, nextProps) {
  entity.pendingProps = nextProps
  invalidate(container)
})

/**
 * Invalidate the container for an entity
 * (Container) -> void
 */

var invalidate = function (container) {
  frame.set(container.id, function () {
    render(container.node, container.virtualElement)
  })
}

/**
 * DOM Functions
 * ============================================================================
 */

/**
 * Patch an container with a new virtual element
 */

var patchNativeElement = function (container, entity, previousElement, nextElement, nativeElement) {
  return reduce(
    diff(previousElement, nextElement),
    patch(container, entity),
    nativeElement
  )
}

/**
 * Apply a patch to an element
 */

var patch = curry(function (container, entity, parentElement, change) {
  var path = change.path
  var nextElement = change.nextElement
  var previousElement = change.previousElement
  var nativeElement = dom.getElementByPath(change.path, parentElement)
  switch (change.type) {
    case 'replaceText':
      nativeElement.data = change.value
    case 'replaceElement':
      replaceElement(container, entity, path, nativeElement, nextElement)
    case 'removeElement':
      removeElement(container, entity, path, nativeElement)
    case 'insertElement':
      insertElement(container, entity, path, nativeElement, nextElement)
    case 'moveElement':
      moveElement(container, entity, nativeElement, change.previousPath, change.path)
    case 'updateComponent':
      updateProps(container, entity, change.path, change.value)
    case 'removeComponent':
      removeEntity()
    case 'setAttribute':
      setAttribute()
    case 'removeAttribute':
      removeAttribute()
  }
})

/**
 * Create a native element from a virtual element.
 */

var toNativeElement = function (container, entity, path, vnode) {
  var tagName = vnode.type
  var el = isSVGElement(tagName) ? document.createElementNS(svgNamespace, vnode.type) : document.createElement(vnode.type)
  forEach(vnode.attributes, setAttribute(container, entity, path, el))
  forEach(vnode.children, function (child, i) {
    if (child == null) return
    var childEl = renderElement(container, entity, path + '.' + i, child)
    el.appendChild(childEl)
  })
  return el
}

/**
 * Create an event handler that can return a value to update state
 * instead of relying on side-effects.
 */

var handleEvent = curry(function (container, entity, fn, e) {
  if (entity) {
    var update = updateState(container, entity)
    update(fn(e, entity, update))
  } else {
    fn(e)
  }
})

/**
 * Handle an event that has occured within the container
 *
 * @param {Event} event
 */

var handleNativeEvent = function (event) {
  var target = event.target
  while (target) {
    var fn = handler.get([target.__container__, event.type, target.__entity__, target.__path__])
    if (fn) {
      event.delegateTarget = target
      fn(event)
      break
    }
    target = target.parentNode
  }
}

/**
 * Set the attribute of an element, performing additional transformations
 * dependning on the attribute name
 */

var setAttribute = curry(function (container, entity, path, el, value, name) {
  if (events[name]) {
    handler.set([entity.id, path, events[name]], handleEvent(container, entity, value))
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = true
      el.setAttribute(name, value)
      break
    case 'innerHTML':
    case 'value':
      el[name] = value
      break
    case isSVGAttribute(name):
      el.setAttributeNS(svgNamespace, name, value)
      break
    default:
      el.setAttribute(name, value)
      break
  }
})

/**
 * Remove an attribute, performing additional transformations
 * depending on the attribute name
 */

var removeAttribute = curry(function (container, entity, path, el, name) {
  if (events[name]) {
    handler.remove([entity.id, path, events[name]])
    return
  }
  switch (name) {
    case 'checked':
    case 'disabled':
    case 'selected':
      el[name] = false
      el.removeAttribute(name)
      break
    case 'innerHTML':
    case 'value':
      el[name] = ''
      break
    default:
      el.removeAttribute(name)
      break
  }
})

/**
 * Add all of the DOM event listeners
 */

var addNativeEventListeners = function (handler) {
  forEach(events, function (eventType) {
    document.body.addEventListener(eventType, handler, true)
  })
}

/**
 * Add all of the DOM event listeners
 */

var removeNativeEventListeners = function (handler) {
  forEach(events, function (eventType) {
    document.body.removeEventListener(eventType, handler, true)
  })
}

/**
 * Helper Functions
 * ============================================================================
 */

/**
 * Maybe merge two objects
 */

function merge (one, two) {
  return assign(one || {}, two || {})
}

/**
 * Get the component from a virtual element
 */

var getComponent = function (vnode) {
  var component = vnode.type
  validateComponent(component)
  return component
}

/**
 * Call hooks for all new entities that have been created in
 * the last render from the bottom up.
 */

var flushMountQueue = function () {
  while (mountQueue.length) {
    var entity = mountQueue.pop()
    trigger('afterRender', entity, [entity, entity.nativeElement])
    entity.updateState(trigger('afterMount', entity, [entity, entity.nativeElement, entity.updateState]))
  }
}

/**
 * Exports
 * ============================================================================
 */

/**
 * Render a vnode into a container. If that container already exists
 * we'll just perform an update.
 */

exports.render = curry(function (node, nextElement) {
  var container = containers.create(node)
  var nativeElement = container.nativeElement
  var virtualElement = container.virtualElement
  frame.clear(container.id)
  if (!nativeElement) {
    container.nativeElement = renderElement(container, null, '0', nextElement)
    node.appendChild(container.nativeElement)
  } else {
    container.nativeElement = patchNativeElement(container, container, virtualElement, nextElement, nativeElement)
    updateChildren(container)
  }
  container.virtualElement = nextElement
  flushMountQueue()
})

/**
 * Remove any virtual elements from a DOM element container
 *
 * (Node) -> undefined
 */

exports.remove = function (node) {
  var container = containers.get(node)
  if (!container) return
  containers.remove(node)
  frame.clear(container.id)
  removeNativeEventListeners(container)
  removeChildren(container)
  node.removeChild(container.nativeElement)
}

/**
 * Inspect the tree of components within a DOM element container
 *
 * (HTMLElement) -> Object
 */

exports.inspect = function (node) {
  return containers.get(node)
}

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
