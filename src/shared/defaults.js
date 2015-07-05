/**
 * The npm 'defaults' module but without clone because
 * it was requiring the 'Buffer' module which is huge.
 *
 * @param {Object} options
 * @param {Object} defaults
 *
 * @return {Object}
 */

module.exports = function (options, defaults) {
  options = options || {}
  defaults = defaults || {}
  Object.keys(defaults).forEach(function (key) {
    if (typeof options[key] === 'undefined') {
      options[key] = defaults[key]
    }
  })
  return options
}
