/**
 * These are path string helpers. We use paths like 0.2.4 when rendering
 * components within the tree. These are used to identify virtual nodes.
 */

exports.isRoot = isRoot
exports.isWithinPath = isWithinPath

/**
 * Check if a path is actually the root.
 */

function isRoot (path) {
 return path === '0'
}

/**
 * Checks to see if one tree path is within
 * another tree path. Example:
 *
 * 0.1 vs 0.1.1 = true
 * 0.2 vs 0.3.5 = false
 */

function isWithinPath (parentPath, childPath) {
  return childPath.indexOf(parentPath + '.') === 0
}
