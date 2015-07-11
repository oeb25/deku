var tree = require('virtual-element-tree')
var uid = require('get-uid')
var defaults = require('object-defaults')
var forEach = require('fast.js/forEach')
var assign = require('fast.js/object/assign')
var indexOf = require('fast.js/array/indexOf')
var reduce = require('fast.js/reduce')
var isPromise = require('is-promise')
var isEmpty = require('is-empty')
var keypath = require('object-path')
var dom = require('dom-collection')
var events = require('../shared/events')
var isSVGAttribute = require('is-svg-attribute')
var svgNamespace = 'http://www.w3.org/2000/svg'

/**
 * Virtual element functions
 */

var elementHelpers = require('../shared/element')
var nodeType = elementHelpers.nodeType

/**
 * Path functions
 */

/**
 * Functional helpers
 */

var curry = require('ramda/src/curry')
var prop = require('ramda/src/prop')
var compose = require('ramda/src/compose')
var mapObj = require('ramda/src/mapObj')
var map = require('ramda/src/map')

/**
 * Maybe merge two objects
 */

function merge (one, two) {
  return assign(one || {}, two || {})
}

/**
 * Update the entity state using a promise
 */

var updateState = curry(function (containerId, entity, nextState) {
  if (!nextState) return
  if (isPromise(nextState)) return nextState.then(updateState(containerId, entity))
  entity.pendingState = merge(entity.pendingState, nextState)
  invalidate(getContainerById(containerId))
})

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * (EntityId, nextProps) -> void
 */

var updateProps = function (container, entity, nextProps) {
  entity.pendingProps = nextProps
  invalidate(container)
}

/**
 * Invalidate the container for an entity
 * (Container) -> void
 */

var invalidate = function (container) {
  clearFrame(container.id)
  scheduleFrame(bind(update, container), container.id)
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
 * Get the component state
 *
 * @param {Object} entity
 *
 * @return {Object}
 */

var toComponent = function (entity) {
  return {
    id: entity.id,
    props: entity.props,
    state: entity.state
  }
}

/**
 * Remove a container
 */

var removeContainer = function (container) {
  clearFrame(container.id)
  removeNativeElement(container, 'root', '0', container.nativeElement)
  clearContainer(container)
}

/**
 * A component instance.
 */

var createEntity = function (containerId, ownerId, path, type) {
  return {
    id: uid(),
    type: type,
    path: path,
    ownerId: ownerId,
    containerId: containerId
  }
}

/**
 * Render a vnode into a container. If that container already exists
 * we'll just perform an update.
 */

var render = curry(function (node, vnode) {
  var container = getContainerByNode(node)
  var nativeElement = container.nativeElement
  var virtualElement = container.virtualElement

  clearFrame(container)

  if (!nativeElement) {
    container.nativeElement = toNative(container, 'root', '0', vnode)
    node.appendChild(container.nativeElement)
    flushMountQueue()
  } else {
    update(container)
  }
})

var update = function (container) {
  container.nativeElement = patch(container, container.virtualElement, container.virtualElement, container.nativeElement)
  updateChildren(container)
  flushMountQueue()
}

/**
 * Remove a component from the native dom.
 */

var removeEntity = function (container, path, entity) {
  var nativeElement = entity.nativeElement
  beforeUnmount(entity)
  var branch = tree.prune(path, container.tree)
  tree.climb(unmountChildren, branch)
}

/**
 * Component hooks
 */

var afterMount = function (entity) {
  if (!component.afterMount) return
  component.afterMount(toComponent(entity), entity.nativeElement, updateState(entity))
}

var beforeUnmount = function (entity) {
  if (!component.beforeUnmount) return
  component.beforeUnmount(toComponent(entity), entity.nativeElement)
}

/**
 * Update a component instance.
 *
 * - Commit any changes and re-render
 * - If the same virtual element is returned we skip diffing
 */

var updateEntity = function (entity) {
  var currentTree = entity.virtualElement
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
  var entity = createEntity(containerId, parentId, path, component)
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

var toNativeElement = function (container, entity, path, vnode) {
  var el = createElement(vnode.type)
  el.__entity__ = entityId
  el.__path__ = path
  forEach(vnode.attributes, setAttribute(container, entity, path, el))
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

var removeElement = function (container, entity, path, el) {
  removeNestedComponents(container, entity, path)
  removeNestedHandlers(container, path)
  el.parentNode.removeChild(el)
}

/**
 * Replace an element in the DOM. Removing all components
 * within that element and re-rendering the new virtual node.
 */

var replaceElement = function (container, entity, path, el, vnode) {
  removeNestedComponents(container, entity, path)
  removeNestedHandlers(container, path)
  var newEl = toNative(container, entity, path, vnode)
  insertElement(newEl, indexOf(el, el.parentNode.children), parent)
  updateEntityNativeElement(container, entity, newEl)
  return newEl
}

var unmountComponents = curry(function (container, _, path) {
  if (nodeType(node) !== 'component') return
  removeEntity(container, path, get(path, container.tree))
})

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

var handleEvent = curry(function (entity, fn, e) {
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

var setAttribute = function (container, entity, path, el, value, name) {
  if (events[name]) {
    addHandler(container, events[name], entity.id, path, handleEvent(container, entity, value))
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
}

/**
 * Remove an attribute, performing additional transformations
 * depending on the attribute name
 */

var removeAttribute = function (container, entity, path, el, name) {
  if (events[name]) {
    removeHandler(container, events[name], entity.id, path)
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
}

/**
 * Trigger a hook on a component.
 */

var trigger = function (name, entity, args) {
  if (typeof entity.type[name] !== 'function') return
  args.push(updateState(entity.id))
  updateState(entity.id, entity.type[name].apply(null, args))
}

/**
 * Commit props and state changes to an entity.
 */

var commitPendingChanges = function (entity) {
  entity.state = merge(entity.state, entity.pendingState)
  entity.props = merge(entity.props, entity.pendingProps)
  delete entity.pendingState
  delete entity.pendingProps
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
  if (typeof component.render !== 'function') {
    throw new Error(name + ' component needs a render function')
  }
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
  return fn(toComponent(entity.id), entity.pendingProps, entity.pendingState)
}

/**
 * Call hooks for all new entities that have been created in
 * the last render from the bottom up.
 */

var flushMountQueue = function () {
  while (mountQueue.length) {
    var entity = mountQueue.pop()
    trigger('afterRender', entity, [toComponent(entity.id), entity.nativeElement])
    triggerUpdate('afterMount', entity, [toComponent(entity.id), entity.nativeElement, updateState(entityId)])
  }
}

/**
 * Update all the children of an entity.
 *
 * (Entity) -> void
 */

var updateChildren = compose(mapObj(updateEntity), prop('children'))

/**
 * Remove all of the child entities of an entity
 * (Entity) -> void
 */

var removeAllChildren = compose(mapObj(removeEntity), prop('children'))

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

/**
 * Move a DOM element to a new index within it's parent
 */

var moveElement = curry(function (element, newPosition, childEl) {
  var target = element.childNodes[newPosition]
  if (childEl !== target) {
    if (target) {
      element.insertBefore(childEl, target)
    } else {
      element.appendChild(childEl)
    }
  }
})
