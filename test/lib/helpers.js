/** @jsx element */

import {render,remove} from '../../'
import element from 'virtual-element'
import assert from 'assert'

/**
 * Mount a scene, execute a function and then
 * remove the scene. This is used for testing.
 *
 * @param {Application} app
 * @param {Function} fn
 */

exports.mount = function(vnode, fn, errorHandler) {
  var el = document.createElement('div')
  try {
    render(el, vnode)
    if (fn) fn(el)
  }
  catch(e) {
    if (errorHandler) {
      errorHandler(e)
    } else {
      throw e
    }
  }
  finally {
    remove(el)
    assert.equal(el.innerHTML, '')
    if (el.parentNode) el.parentNode.removeChild(el)
  }
}

/**
 * Basic component for testing
 */

exports.HelloWorld = {
  render: function ({ props, state }) {
    return <span>Hello World</span>
  }
}

/**
 * Create a span
 */

exports.Span = {
  render: function ({ props, state }) {
    return <span>{props.text}</span>
  }
}

/**
 * Create a span with two words
 */

exports.TwoWords = {
  render: function ({ props, state }) {
    return <span>{props.one} {props.two}</span>
  }
}

/**
 * Create a div
 */

exports.div = function(){
  var el = document.createElement('div')
  document.body.appendChild(el)
  return el
}
