/**
 * Throw a 404 error if resource is falsy.
 * @param {*} resource - The resource to check
 * @param {string} name - Resource name for error message
 */
function notFound(res, resource, name = 'Resource') {
  if (!resource) {
    res.status(404);
    throw new Error(`${name} not found`);
  }
  return resource;
}

/**
 * Check ownership: throw 403 if non-admin user doesn't own the resource.
 * @param {Object} req - Express request (must have req.User_name)
 * @param {string} resourceUserId - The user_id on the resource
 */
function checkOwner(res, req, resourceUserId) {
  if (req.User_name.role !== 'admin' && resourceUserId !== req.User_name.userId) {
    res.status(403);
    throw new Error('Access denied');
  }
}

/**
 * Combined: find active resource by id, verify it exists, and check ownership.
 * @param {Object} res - Express response
 * @param {Object} req - Express request
 * @param {Model} model - Mongoose model
 * @param {string} id - Document _id
 * @param {Object} options - { name, userIdField, extraFilter }
 * @returns {Document} The found document
 */
async function findAndAuthorize(res, req, model, id, options = {}) {
  const { name = 'Resource', userIdField = 'user_id', extraFilter = {} } = options;
  const doc = await model.findOne({ _id: id, status: 'A', ...extraFilter });
  notFound(res, doc, name);
  checkOwner(res, req, doc[userIdField]);
  return doc;
}

module.exports = { notFound, checkOwner, findAndAuthorize };
