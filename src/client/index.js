var raf = require('component-raf')
var isDom = require('is-dom')
var uid = require('get-uid')
var defaults = require('defaults')
var forEach = require('fast.js/forEach')
var assign = require('fast.js/object/assign')
var reduce = require('fast.js/reduce')
var isPromise = require('is-promise')
var curry = require('curry')
var compose = require('compose-function')
var isEmpty = require('is-empty')
var pool = require('./pool')
var svg = require('../shared/svg')
var pathHelpers = require('../shared/path')
var events = require('../shared/events')
var elementHelpers = require('../shared/element')
var keypath = require('object-path')
var nodeType = elementHelpers.nodeType
var createElement = pool.createElement
var returnElement = pool.returnElement
var isRoot = pathHelpers.isRoot
var isWithinPath = pathHelpers.isWithinPath
var handlers = {}
var containers = {}
var pendingProps = {}
var pendingState = {}
var entities = {}
var mountQueue = []
var children = {}
var frames = {}
var nativeElements = {}
var virtualElements = {}
var entityState = {}
var entityProps = {}
var inProgress = {}

/**
 * Get the container ID given an element
 *
 * @param {HTMLElement} node
 *
 * @return {String}
 */

var getContainerByNode = function (node) {
  for (var id in containers) {
    if (containers[id] === node) return id
  }
}

/**
 * Get a virtual element using the reference id.
 */

var getVirtualElement = function (id) {
  return virtualElements[id]
}

/**
 * Get a container DOM node using the reference id.
 */

var getContainer = function (id) {
  return containers[id]
}

/**
 * Get an entity using the entity id.
 */

var getEntity = function (id) {
  return entities[id]
}

/**
 * Get child entities by reference id.
 */

var getChildren = function (id) {
  return children[id]
}

/**
 * Update all the children of an entity.
 *
 * @param {String} id Component instance id.
 */

var updateChildren = function (entityId) {
  forEach(getChildren(entityId), updateEntity)
}

/**
 * Remove all of the child entities of an entity
 *
 * @param {Entity} entity
 */

var unmountChildren = function (entityId) {
  forEach(getChildren(entityId), removeEntity)
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
 * Find the container id an entity belongs to
 */

var getEntityContainer = function (entity) {
  if (containers[entity.id]) return entity.id
  return getEntityContainer(entity.ownerId)
}

/**
 * Patch an element with the diff from two trees.
 */

var patch = function (entityId, prev, next, el) {
  return diffNode(entityId, '0', prev, next, el)
}

/**
 * Group an array of virtual nodes using their keys
 * @param  {Object} acc
 * @param  {Object} child
 * @return {Object}
 */

var keyMapReducer = function (acc, child) {
  if (child && child.key != null) acc[child.key] = child
  return acc
}

/**
 * Update the entity state using a promise
 *
 * @param {String} entityId
 * @param {Promise} promise
 */

var updateState = curry(function (entityId, nextState) {
  if (!nextState) return
  if (isPromise(nextState)) return nextState.then(updateState(entityId))
  pendingState[entityId] = assign(pendingState[entityId] || {}, nextState)
  invalidateEntity(entityId)
})

/**
 * Replace the props for an instance
 */

var replaceProps = function (entityId, nextProps) {
  pendingProps[entityId] = nextProps
  return entityId
}

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * (EntityId, nextProps) -> void
 */

var updateProps = compose(invalidateEntity, replaceProps)

/**
 * Invalidate the container for an entity
 * (EntityId) -> void
 */

var invalidateEntity = compose(scheduleFrame, clearFrame, getEntityContainer, getEntity)

/**
 * Add all of the DOM event listeners
 */

var addNativeEventListeners = function () {
  forEach(events, function (eventType) {
    document.body.addEventListener(eventType, handleNativeEvent, true)
  })
}

/**
 * Add all of the DOM event listeners
 */

var removeNativeEventListeners = function () {
  forEach(events, function (eventType) {
    document.body.removeEventListener(eventType, handleNativeEvent, true)
  })
}

/**
 * Get a handler for an entity
 */

var getHandler = function (entityId, path, eventType) {
  keypath.get(handlers, [entityId, path, eventType])
}

/**
 * Add an event handler for an entity at a path
 */

var addHandler = function (entityId, path, eventType, fn) {
  keypath.set(handlers, [entityId, path, eventType], fn)
}

/**
 * Remove a single event handler for an entity
 */

var removeHandler = function (entityId, path, eventType) {
  var args = [entityId]
  if (path) args.push(path)
  if (eventType) args.push(eventType)
  keypath.del(handlers, args)
}

/**
 * Remove all event handlers for an entity
 */

var removeAllHandlers = function (entityId) {
  keypath.del(handlers, [entityId])
}

/**
 * Is an entity dirty and in need of a re-render?
 *
 * @param {Object} entity
 *
 * @return {Boolean}
 */

var isDirty = function (entityId) {
  return entityId in pendingProps || entityId in pendingState
}

/**
 * A rendered component instance.
 */

var createEntity = function (id, type, ownerId) {
  return {
    id: id,
    ownerId: ownerId,
    type: type
  }
}

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
 *
 * @param {Object} container
 */

var removeContainer = function (containerId) {
  clearFrame(containerId)
  removeElement(containerId, '0', nativeElements[containerId])
  delete nativeElements[containerId]
  delete virtualElements[containerId]
  delete containers[containerId]
  if (isEmpty(containers)) removeNativeEventListeners()
}

/**
 * Create a new container given an element
 *
 * @param {HTMLElement} container
 *
 * @return {String} id
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
  addNativeEventListeners()
  var containerId = uid()
  containers[containerId] = node
  children[containerId] = {}
  return containerId
}

/**
 * Render a vnode into a container
 *
 * @param  {HTMLElement} container
 * @param  {Object} vnode
 */

var render = curry(function (node, vnode) {
  var containerId = getContainerByNode(node) || createContainer(node)
  // var isRendering = inProgress[containerId]
  var nativeElement = nativeElements[containerId]
  var virtualElement = getVirtualElement(containerId)
  clearFrame(containerId)
  if (!nativeElement) {
    nativeElement = toNative(containerId, '0', vnode)
    node.appendChild(nativeElement)
  } else {
    if (virtualElement !== vnode) {
      nativeElement = patch(containerId, virtualElement, vnode, nativeElement)
    }
    updateChildren(containerId)
  }
  nativeElements[containerId] = nativeElement
  virtualElements[containerId] = vnode
  delete inProgress[containerId]
  flushMountQueue()
})

/**
 * Remove a component from the native dom.
 *
 * @param {Entity} entity
 */

var removeEntity = function (entityId) {
  var entity = entities[entityId]
  if (!entity) return
  var nativeElement = nativeElements[entityId]
  trigger('beforeUnmount', entity, [toComponent(entityId), nativeElement])
  unmountChildren(entityId)
  removeAllHandlers(entityId)
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
 * Update a component.
 *
 * - Commit any changes and re-render
 * - If the same virtual element is returned we skip diffing
 *
 * @param {String} entityId
 */

var updateEntity = function (entityId) {
  var entity = entities[entityId]
  var currentTree = virtualElements[entityId]
  var currentElement = nativeElements[entityId]
  var previousState = entity.state
  var previousProps = entity.props
  var shouldUpdate = shouldRender(entity)
  commitPendingChanges(entity.id)
  if (!shouldUpdate) return updateChildren(entityId)
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
 * Create a native element from a component.
 */

var toNativeComponent = function (parentId, path, vnode) {
  var entity = createEntity(path, vnode.component, parentId)
  var initialProps = defaults(vnode.props, entity.type.defaultProps)
  var initialState = entity.type.initialState ? entity.type.initialState(initialProps) : {}
  children[parentId] = {}
  children[parentId][path] = entity.id
  entityProps[entity.id] = initialProps
  entityState[entity.id] = initialState
  entities[entity.id] = entity
  commitPendingChanges(entity.id)
  var virtualElement = renderEntity(entity)
  var nativeElement = toNative(entity.id, '0', virtualElement)
  virtualElements[entity.id] = virtualElement
  nativeElements[entity.id] = nativeElement
  mountQueue.push(entity.id)
  return nativeElement
}

/**
 * Create a native element from a virtual element.
 *
 * @param {String} entityId
 * @param {String} path
 * @param {Object} vnode
 *
 * @return {HTMLDocumentFragment}
 */

var toNative = function (entityId, path, vnode) {
  switch (nodeType(vnode)) {
    case 'text':
      return document.createTextNode(vnode)
    case 'element':
      return toNativeElement(entityId, path, vnode)
    case 'component':
      return toNativeComponent(entityId, path, vnode)
  }
}

/**
 * Create a native element from a virtual element.
 */

var toNativeElement = function (entityId, path, vnode) {
  var el = createElement(vnode.type)
  el.__entity__ = entityId
  el.__path__ = path
  forEach(vnode.attributes, function (value, name) {
    setAttribute(entityId, path, el, name, value)
  })
  forEach(vnode.children, function (child, i) {
    if (child == null) return
    var childEl = toNative(entityId, path + '.' + i, child)
    if (!childEl.parentNode) el.appendChild(childEl)
  })
  return el
}

/**
 * Create a diff between two trees of nodes.
 */

var diffNode = function (entityId, path, prev, next, el) {
  var nextType = nodeType(next)
  var prevType = nodeType(prev)
  if (nextType !== prevType) {
    return replaceElement(entityId, path, el, next)
  }
  switch (nextType) {
    case 'text':
      return diffText(prev, next, el)
    case 'element':
      return diffElement(path, entityId, prev, next, el)
    case 'component':
      return diffComponent(path, entityId, prev, next, el)
  }
}

/**
 * Diff two text nodes and update the element.
 */

var diffText = function (previous, current, el) {
  if (current !== previous) el.data = current
  return el
}

/**
 * Diff the children of an ElementNode.
 */

var diffChildren = function (path, entityId, prev, next, el) {
  var positions = []
  var childNodes = Array.prototype.slice.apply(el.childNodes)
  var leftKeys = reduce(prev.children, keyMapReducer, {})
  var rightKeys = reduce(next.children, keyMapReducer, {})
  var currentChildren = assign({}, children[entityId])

  // Diff all of the nodes that have keys. This lets us re-used elements
  // instead of overriding them and lets us move them around.
  if (!isEmpty(leftKeys) && !isEmpty(rightKeys)) {

    // Removals
    forEach(leftKeys, function (leftNode, key) {
      if (rightKeys[key] == null) {
        var leftPath = path + '.' + leftNode.index
        removeElement(
          entityId,
          leftPath,
          childNodes[leftNode.index]
        )
      }
    })

    // Update nodes
    forEach(rightKeys, function (rightNode, key) {
      var leftNode = leftKeys[key]

      // We only want updates for now
      if (leftNode == null) return

      var leftPath = path + '.' + leftNode.index

      // Updated
      positions[rightNode.index] = diffNode(
        leftPath,
        entityId,
        leftNode,
        rightNode,
        childNodes[leftNode.index]
      )
    })

    // Update the positions of all child components and event handlers
    forEach(rightKeys, function (rightNode, key) {
      var leftNode = leftKeys[key]

      // We just want elements that have moved around
      if (leftNode == null || leftNode.index === rightNode.index) return

      var rightPath = path + '.' + rightNode.index
      var leftPath = path + '.' + leftNode.index

      // Update all the child component path positions to match
      // the latest positions if they've changed. This is a bit hacky.
      forEach(currentChildren, function (childId, childPath) {
        if (leftPath === childPath) {
          delete children[entityId][childPath]
          children[entityId][rightPath] = childId
        }
      })
    })

    // Now add all of the new nodes last in case their path
    // would have conflicted with one of the previous paths.
    forEach(rightKeys, function (rightNode, key) {
      var rightPath = path + '.' + rightNode.index
      if (leftKeys[key] == null) {
        positions[rightNode.index] = toNative(
          entityId,
          rightPath,
          rightNode
        )
      }
    })

  } else {
    var maxLength = Math.max(prev.children.length, next.children.length)

    // Now diff all of the nodes that don't have keys
    for (var i = 0; i < maxLength; i++) {
      var leftNode = prev.children[i]
      var rightNode = next.children[i]

      // Both null
      if (leftNode == null && rightNode == null) {
        continue
      }

      // Removals
      if (rightNode == null) {
        removeElement(
          entityId,
          path + '.' + leftNode.index,
          childNodes[leftNode.index]
        )
      }

      // New Node
      if (leftNode == null) {
        positions[rightNode.index] = toNative(
          entityId,
          path + '.' + rightNode.index,
          rightNode
        )
      }

      // Updated
      if (leftNode && rightNode) {
        positions[leftNode.index] = diffNode(
          path + '.' + leftNode.index,
          entityId,
          leftNode,
          rightNode,
          childNodes[leftNode.index]
        )
      }
    }
  }

  forEach(positions, moveElement(el))
}

/**
 * Diff the attributes and add/remove them.
 */

var diffAttributes = function (prev, next, el, entityId, path) {
  var nextAttrs = next.attributes
  var prevAttrs = prev.attributes

  // add new attrs
  forEach(nextAttrs, function (value, name) {
    if (nextAttrs == null) {
      removeAttribute(entityId, path, el, name)
    } else if (events[name] || !(name in prevAttrs) || prevAttrs[name] !== value) {
      setAttribute(entityId, path, el, name, value)
    }
  })

  // remove old attrs
  forEach(prevAttrs, function (value, name) {
    if (!(name in nextAttrs)) {
      removeAttribute(entityId, path, el, name)
    }
  })
}

/**
 * Update a component with the props from the next node. If
 * the component type has changed, we'll just remove the old one
 * and replace it with the new component.
 */

var diffComponent = function (path, entityId, prev, next, el) {
  if (next.type !== prev.type) return replaceElement(entityId, path, el, next)
  updateProps(children[entityId][path], next.attributes)
  // TODO: We could update here straight away and skip looping through children later
  return el
}

/**
 * Diff two element nodes.
 */

var diffElement = function (path, entityId, prev, next, el) {
  if (next.type !== prev.type) return replaceElement(entityId, path, el, next)
  diffAttributes(prev, next, el, entityId, path)
  diffChildren(path, entityId, prev, next, el)
  return el
}

/**
 * Removes an element from the DOM and unmounts and components
 * that are within that branch
 *
 * side effects:
 *   - removes element from the DOM
 *   - removes internal references
 *
 * @param {String} entityId
 * @param {String} path
 * @param {HTMLElement} el
 */

var removeElement = function (entityId, path, el) {
  var childrenByPath = children[entityId]
  var childId = childrenByPath[path]
  var entityHandlers = handlers[entityId] || {}
  var removals = []

  // If the path points to a component we should use that
  // components element instead, because it might have moved it.
  if (childId) {
    el = nativeElements[childId]
    removeEntity(childId)
    removals.push(path)
  } else {

    // Just remove the text node
    if (el.tagName) return el.parentNode.removeChild(el)

    // Then we need to find any components within this
    // branch and unmount them.
    forEach(childrenByPath, function (childId, childPath) {
      if (childPath === path || isWithinPath(path, childPath)) {
        removeEntity(childId)
        removals.push(childPath)
      }
    })

    // Remove all events at this path or below it
    forEach(entityHandlers, function (fn, handlerPath) {
      if (handlerPath === path || isWithinPath(path, handlerPath)) {
        removeHandler(entityId, handlerPath)
      }
    })
  }

  forEach(removals, function (path) {
    delete children[entityId][path]
  })
  el.parentNode.removeChild(el)
  returnElement(el)
}

/**
 * Replace an element in the DOM. Removing all components
 * within that element and re-rendering the new virtual node.
 *
 * @param {Entity} entity
 * @param {String} path
 * @param {HTMLElement} el
 * @param {Object} vnode
 *
 * @return {void}
 */

var replaceElement = function (entityId, path, el, vnode) {
  var parent = el.parentNode
  var index = Array.prototype.indexOf.call(parent.childNodes, el)

  // remove the previous element and all nested components. This
  // needs to happen before we create the new element so we don't
  // get clashes on the component paths.
  removeElement(entityId, path, el)

  // then add the new element in there
  var newEl = toNative(entityId, path, vnode)
  moveElement(parent, newEl, index)

  if (isRoot(path)) {
    updateEntityNativeElement(entityId, newEl)
  }

  return newEl
}

/**
 * Move a DOM element to a new index within it's parent
 */

var moveElement = curry(function (element, childEl, newPosition) {
  var target = element.childNodes[newPosition]
  if (childEl !== target) {
    if (target) {
      element.insertBefore(childEl, target)
    } else {
      element.appendChild(childEl)
    }
  }
})

/**
 * Update all entities in a branch that have the same nativeElement. This
 * happens when a component has another component as it's root node.
 *
 * @param {String} entityId
 * @param {HTMLElement} newEl
 *
 * @return {void}
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
 *
 * @param {HTMLElement} el
 * @param {String} name
 * @param {String} value
 */

var setAttribute = function (entityId, path, el, name, value) {
  if (events[name]) {
    addHandler(entityId, path, events[name], handleEvent(entityId, value))
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
 * dependning on the attribute name
 *
 * @param {HTMLElement} el
 * @param {String} name
 */

var removeAttribute = function (entityId, path, el, name) {
  if (events[name]) {
    removeHandler(entityId, path, events[name])
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
 *
 * @param {String} name Name of hook.
 * @param {Entity} entity The component instance.
 * @param {Array} args To pass along to hook.
 */

var trigger = function (name, entity, args) {
  if (typeof entity.type[name] !== 'function') return
  return entity.type[name].apply(null, args)
}

/**
 * Trigger a hook on the component and allow state to be
 * updated too.
 *
 * @param {String} name
 * @param {Object} entity
 * @param {Array} args
 *
 * @return {void}
 */

var triggerUpdate = function (name, entity, args) {
  args.push(updateState(entity.id))
  updateState(entity.id, trigger(name, entity, args))
}

/**
 * Commit props and state changes to an entity.
 */

var commitPendingChanges = function (entityId) {
  entityState[entityId] = assign(entityState[entityId] || {}, pendingState[entityId])
  entityProps[entityId] = assign(entityProps[entityId] || {}, pendingProps[entityId])
  delete pendingState[entityId]
  delete pendingProps[entityId]
}

/**
 * Handle an event that has occured within the container
 *
 * @param {Event} event
 */

var handleNativeEvent = function (event) {
  var target = event.target
  var eventType = event.type
  while (target) {
    var fn = getHandler(target.__entity__, target.__path__, eventType)
    if (fn) {
      event.delegateTarget = target
      fn(event)
      break
    }
    target = target.parentNode
  }
}

/**
 * Render the entity and make sure it returns a node
 *
 * @param {Entity} entity
 *
 * @return {VirtualTree}
 */

var renderEntity = function (entity) {
  var render = entity.type.render
  if (!render) throw new Error('Component needs a render function')
  var result = render(toComponent(entity.id), updateState(entity.id))
  if (!result) throw new Error('Render function must return an element.')
  return result
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
 * Get the entity tree for a container. This allows you to view the tree
 * of components, including their state. This could be used to create developer
 * tools or to inject props into components within the tree.
 *
 * @param {HTMLElement} container
 */

var inspectNode = curry(function (path, id) {
  var node = {
    id: id,
    path: path,
    nativeElement: nativeElements[id],
    props: entityProps[id],
    state: entityState[id],
    children: {}
  }
  for (var childPath in children[id]) {
    node.children[childPath] = inspectNode(id, children[id][childPath])
  }
  return node
})

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
exports.inspect = curry(compose(inspectNode('root'), getContainerByNode))

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
