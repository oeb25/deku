/**
 * This module provides a way to pool DOM elements. Creating brand new DOM
 * elements can be an expensive process so we can just re-use elements that
 * have already been made.
 */

var svg = require('../shared/svg')
var walk = require('dom-walk')
var Pool = require('dom-pool')
var forEach = require('fast.js/forEach')
var statefulElements = ['input', 'textarea']
var pools = {}

exports.createElement = createElement
exports.returnElement = addToPool

function createElement (tagName) {
  if (isPoolableElement(tagName)) {
    return prepareElement(getElementPool(tagName).pop())
  }
  return createNativeElement(tagName)
}

function getElementPool (tagName) {
  var pool = pools[tagName]
  if (!pool) {
    var poolOpts = svg.isElement(tagName) ?
      { namespace: svg.namespace, tagName: tagName } :
      { tagName: tagName }
    pool = pools[tagName] = new Pool(poolOpts)
  }
  return pool
}

function createNativeElement (tagName, namespace) {
  if (svg.isElement(tagName)) {
    return document.createElementNS(svg.namespace, tagName)
  } else {
    return document.createElement(tagName)
  }
}

function prepareElement (el) {
  removeAllChildren(el)
  removeAllAttributes(el)
  return el
}

function removeAllAttributes (el) {
  forEach(el.attributes, function (attr) {
    el.removeAttribute(attr.name)
  })
}

function removeAllChildren (el) {
  while (el.firstChild) el.removeChild(el.firstChild)
}

function isPoolableElement (tagName) {
  return statefulElements.indexOf(tagName) < 0
}

function addToPool (el) {
  walk(el, function (node) {
    if (!node.tagName || !isPoolableElement(node.tagName)) return
    getElementPool(node.tagName.toLowerCase()).push(node)
  })
}
