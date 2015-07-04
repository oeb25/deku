var raf = require('component-raf')
var isDom = require('is-dom')
var uid = require('get-uid')
var defaults = require('defaults')
var forEach = require('fast.js/forEach')
var assign = require('fast.js/object/assign')
var reduce = require('fast.js/reduce')
var indexOf = require('fast.js/array/indexOf')
var isPromise = require('is-promise')
var curry = require('curry')
var compose = require('compose-function')
var isEmpty = require('is-empty')
var pool = require('./pool')
var handlers = require('./handlers')
var svg = require('../shared/svg')
var pathHelpers = require('../shared/path')
var events = require('../shared/events')
var elementHelpers = require('../shared/element')
var nodeType = elementHelpers.nodeType
var createElement = pool.createElement
var returnElement = pool.returnElement
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

// (HTMLElement, VirtualElement) -> void
exports.render = curry(render)

// (Node) -> undefined
exports.remove = compose(removeContainer, getContainerByNode)

// (HTMLElement) -> Object
exports.inspect = inspect

// (EntityId, Object) -> void
exports.updateState = updateState

// (EntityId, Object) -> void
exports.updateProps = updateProps

/**
 * Remove a container
 *
 * @param {Object} container
 */

function removeContainer (containerId) {
  clearFrame(containerId)
  removeElement(containerId, '0', nativeElements[containerId])
  delete nativeElements[containerId]
  delete virtualElements[containerId]
  delete containers[containerId]
  if (isEmpty(containers)) removeNativeEventListeners()
}

/**
 * Get the entity tree for a container. This allows you to view the tree
 * of components, including their state. This could be used to create developer
 * tools or to inject props into components within the tree.
 *
 * @param {HTMLElement} container
 */

function inspect (node) {
  debugger
  // var container = getContainerByNode(node)
}

/**
 * Get the container ID given an element
 *
 * @param {HTMLElement} node
 *
 * @return {String}
 */

function getContainerByNode (node) {
  for (var id in containers) {
    if (containers[id] === node) return id
  }
}

/**
 * Create a new container given an element
 *
 * @param {HTMLElement} container
 *
 * @return {String} id
 */

function createContainer (node) {
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
 * Tell the container it's dirty and needs to re-render.
 */

function invalidate (entityId) {
  var containerId = getEntityContainer(entityId)
  var frameId = frames[containerId]
  if (frameId) return
  frames[containerId] = raf(function () {
    render(containers[containerId], virtualElements[containerId])
  })
}

/**
 * Clear the current scheduled frame
 */

function clearFrame (containerId) {
  var frameId = frames[containerId]
  if (!frameId) return
  raf.cancel(frameId)
  delete frames[containerId]
}

/**
 * Find the container id an entity belongs to
 */

function getEntityContainer (entity) {
  if (containers[entity.id]) return entity.id
  return getEntityContainer(entity.ownerId)
}

/**
 * Render a vnode into a container
 *
 * @param  {HTMLElement} container
 * @param  {Object} vnode
 */

function render (node, vnode) {
  var containerId = getContainerByNode(node) || createContainer(node)
  var isRendering = inProgress[containerId]
  var nativeElement = nativeElements[containerId]
  var virtualElement = virtualElements[containerId]

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
}

/**
 * Remove a component from the native dom.
 *
 * @param {Entity} entity
 */

function unmountEntity (entityId) {
  var entity = entities[entityId]
  if (!entity) return
  var nativeElement = nativeElements[entityId]
  trigger('beforeUnmount', entity, [toComponent(entityId), nativeElement])
  unmountChildren(entityId)
  handlers.removeAllHandlers(entityId)
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

function updateEntity (entityId) {
  var entity = entities[entityId]
  var currentTree = virtualElements[entityId]
  var currentElement = nativeElements[entityId]
  var previousState = entity.state
  var previousProps = entity.props
  var shouldUpdate = shouldRender(entity)
  commit(entity.id)
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
 * Update all the children of an entity.
 *
 * @param {String} id Component instance id.
 */

function updateChildren (entityId) {
  forEach(children[entityId], updateEntity)
}

/**
 * Remove all of the child entities of an entity
 *
 * @param {Entity} entity
 */

function unmountChildren (entityId) {
  forEach(children[entityId], unmountEntity)
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

function toNative (entityId, path, vnode) {
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

function toNativeElement (entityId, path, vnode) {
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
 * Create a native element from a component.
 */

function toNativeComponent (parentId, path, vnode) {
  var entity = createEntity(path, vnode.component, parentId)
  var initialProps = defaults(vnode.props, entity.type.defaultProps)
  var initialState = entity.type.initialState ? entity.type.initialState(initialProps) : {}
  children[parentId] = {}
  children[parentId][path] = entity.id
  entityProps[entity.id] = initialProps
  entityState[entity.id] = initialState
  entities[entity.id] = entity
  commit(entity.id)
  var virtualElement = renderEntity(entity)
  var nativeElement = toNative(entity.id, '0', virtualElement)
  virtualElements[entity.id] = virtualElement
  nativeElements[entity.id] = nativeElement
  mountQueue.push(entity.id)
  return nativeElement
}

/**
 * Patch an element with the diff from two trees.
 */

function patch (entityId, prev, next, el) {
  return diffNode(entityId, '0', prev, next, el)
}

/**
 * Create a diff between two trees of nodes.
 */

function diffNode (entityId, path, prev, next, el) {
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

function diffText (previous, current, el) {
  if (current !== previous) el.data = current
  return el
}

/**
 * Group an array of virtual nodes using their keys
 * @param  {Object} acc
 * @param  {Object} child
 * @return {Object}
 */

function keyMapReducer (acc, child) {
  if (child && child.key != null) {
    acc[child.key] = child
  }
  return acc
}

/**
 * Diff the children of an ElementNode.
 */

function diffChildren (path, entityId, prev, next, el) {
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

  moveChildren(el, positions)
}

/**
 * Move child nodes to their new position
 */

function moveChildren (element, positions) {
  forEach(positions, function (childEl, newPosition) {
    var target = element.childNodes[newPosition]
    if (childEl !== target) {
      if (target) {
        element.insertBefore(childEl, target)
      } else {
        element.appendChild(childEl)
      }
    }
  })
}

/**
 * Diff the attributes and add/remove them.
 */

function diffAttributes (prev, next, el, entityId, path) {
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

function diffComponent (path, entityId, prev, next, el) {
  if (next.type !== prev.type) return replaceElement(entityId, path, el, next)
  var targetId = children[entityId][path]
  updateProps(targetId, next.props)
  return el
}

/**
 * Diff two element nodes.
 */

function diffElement (path, entityId, prev, next, el) {
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

function removeElement (entityId, path, el) {
  var childrenByPath = children[entityId]
  var childId = childrenByPath[path]
  var entityHandlers = handlers[entityId] || {}
  var removals = []

  // If the path points to a component we should use that
  // components element instead, because it might have moved it.
  if (childId) {
    el = nativeElements[childId]
    unmountEntity(childId)
    removals.push(path)
  } else {

    // Just remove the text node
    if (el.tagName) return el.parentNode.removeChild(el)

    // Then we need to find any components within this
    // branch and unmount them.
    forEach(childrenByPath, function (childId, childPath) {
      if (childPath === path || pathHelpers.isWithinPath(path, childPath)) {
        unmountEntity(childId)
        removals.push(childPath)
      }
    })

    // Remove all events at this path or below it
    forEach(entityHandlers, function (fn, handlerPath) {
      if (handlerPath === path || pathHelpers.isWithinPath(path, handlerPath)) {
        handlers.removeHandler(entityId, handlerPath)
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

function replaceElement (entityId, path, el, vnode) {
  var parent = el.parentNode
  var index = Array.prototype.indexOf.call(parent.childNodes, el)

  // remove the previous element and all nested components. This
  // needs to happen before we create the new element so we don't
  // get clashes on the component paths.
  removeElement(entityId, path, el)

  // then add the new element in there
  var newEl = toNative(entityId, path, vnode)
  var target = parent.childNodes[index]

  if (target) {
    parent.insertBefore(newEl, target)
  } else {
    parent.appendChild(newEl)
  }

  if (pathHelpers.isRoot(path)) {
    updateEntityNativeElement(entityId, newEl)
  }

  return newEl
}

/**
 * Update all entities in a branch that have the same nativeElement. This
 * happens when a component has another component as it's root node.
 *
 * @param {String} entityId
 * @param {HTMLElement} newEl
 *
 * @return {void}
 */

function updateEntityNativeElement (entityId, newEl) {
  var target = entities[entityId]
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

var eventHandler = curry(function (entityId, e) {
  var entity = entities[entityId]
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

function setAttribute (entityId, path, el, name, value) {
  if (events[name]) {
    addEvent(entityId, path, events[name], eventHandler(entityId))
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

function removeAttribute (entityId, path, el, name) {
  if (events[name]) {
    handlers.removeHandler(entityId, path, events[name])
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

function trigger (name, entity, args) {
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

function triggerUpdate (name, entity, args) {
  args.push(updateState(entity.id))
  updateState(entity.id, trigger(name, entity, args))
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
  invalidate(entityId)
})

/**
 * Update an entity to match the latest rendered vode. We always
 * replace the props on the component when composing them. This
 * will trigger a re-render on all children below this point.
 *
 * @param {Entity} entity
 * @param {String} path
 * @param {Object} vnode
 *
 * @return {void}
 */

var updateProps = curry(function (entityId, nextProps) {
  pendingProps[entityId] = nextProps
  invalidate(entityId)
})

/**
 * Commit props and state changes to an entity.
 */

function commit (entity) {
  entityState[entity.id] = assign(entityState[entity.id] || {}, pendingState[entity.id])
  entityProps[entity.id] = assign(entityProps[entity.id] || {}, pendingProps[entity.id])
  delete pendingState[entity.id]
  delete pendingProps[entity.id]
}

/**
 * Handle an event that has occured within the container
 *
 * @param {Event} event
 */

function handleEvent (event) {
  var target = event.target
  var eventType = event.type
  while (target) {
    var fn = handlers.getHandler(target.__entity__, target.__path__, eventType)
    if (fn) {
      event.delegateTarget = target
      fn(event)
      break
    }
    target = target.parentNode
  }
}

/**
 * A rendered component instance.
 *
 * This manages the lifecycle, props and state of the component.
 * It's basically just a data object for more straightfoward lookup.
 *
 * @param {Component} component
 * @param {Object} props
 */

function createEntity (id, type, ownerId) {
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

function toComponent (entityId) {
  return {
    id: entityId,
    props: entityProps[entityId],
    state: entityState[entityId]
  }
}

/**
 * Render the entity and make sure it returns a node
 *
 * @param {Entity} entity
 *
 * @return {VirtualTree}
 */

function renderEntity (entity) {
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

function shouldRender (entity) {
  if (!isDirty(entity)) return false
  var fn = entity.type.shouldRender || entity.type.shouldUpdate
  if (!fn) return true
  var nextProps = pendingProps[entity.id]
  var nextState = pendingState[entity.id]
  return fn(toComponent(entity.id), nextProps, nextState)
}

/**
 * Is an entity dirty and in need of a re-render?
 *
 * @param {Object} entity
 *
 * @return {Boolean}
 */

function isDirty (entityId) {
  return entityId in pendingProps || entityId in pendingState
}

/**
 * Call hooks for all new entities that have been created in
 * the last render from the bottom up.
 */

function flushMountQueue () {
  while (mountQueue.length) {
    var entityId = mountQueue.pop()
    var entity = entities[entityId]
    var nativeElement = nativeElements[entityId]
    trigger('afterRender', entity, [toComponent(entity.id), nativeElement])
    triggerUpdate('afterMount', entity, [toComponent(entity.id), nativeElement, updateState(entityId)])
  }
}

/**
 * Add all of the DOM event listeners
 */

function addNativeEventListeners () {
  forEach(events, function (eventType) {
    document.body.addEventListener(eventType, handleEvent, true)
  })
}

/**
 * Add all of the DOM event listeners
 */

function removeNativeEventListeners () {
  forEach(events, function (eventType) {
    document.body.removeEventListener(eventType, handleEvent, true)
  })
}
