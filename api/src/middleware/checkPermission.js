/**
 * Permission-checking middleware.
 *
 * Must be placed AFTER verifyToken middleware so that req.User_name
 * contains the decoded JWT payload with role and permissions.
 */

/**
 * Returns true if the user should bypass permission checks.
 * Admin role or wildcard permission ['*'] grants full access.
 */
function isAdminUser(decoded) {
  return decoded.role === 'admin' || (Array.isArray(decoded.permissions) && decoded.permissions.includes('*'));
}

/**
 * Middleware that checks if the authenticated user has ALL of the
 * required permissions.
 *
 * @param {...string} requiredPermissions - Permission keys (e.g. 'devices:read')
 */
function checkPermission(...requiredPermissions) {
  return (req, res, next) => {
    const decoded = req.User_name;
    if (!decoded) {
      return res.status(401).json({ message: 'ERROR', data: 'Authentication required' });
    }

    // Admin bypass
    if (isAdminUser(decoded)) {
      return next();
    }

    const userPermissions = decoded.permissions || [];
    const missing = requiredPermissions.filter((p) => !userPermissions.includes(p));

    if (missing.length > 0) {
      return res.status(403).json({
        message: 'ERROR',
        data: 'Insufficient permissions',
        missing,
      });
    }

    next();
  };
}

/**
 * Middleware that only allows admin users through.
 */
function requireAdmin(req, res, next) {
  const decoded = req.User_name;
  if (!decoded) {
    return res.status(401).json({ message: 'ERROR', data: 'Authentication required' });
  }

  if (!isAdminUser(decoded)) {
    return res.status(403).json({ message: 'ERROR', data: 'Admin access required' });
  }

  next();
}

/**
 * Middleware that ensures the :user_id param matches the authenticated user.
 * Admins bypass this check and can access any user's data.
 *
 * @param {string} paramName - Name of the URL param (default: 'user_id')
 */
function checkSelfOrAdmin(paramName = 'user_id') {
  return (req, res, next) => {
    const decoded = req.User_name;
    if (!decoded) {
      return res.status(401).json({ message: 'ERROR', data: 'Authentication required' });
    }

    if (isAdminUser(decoded)) {
      return next();
    }

    const targetUserId = req.params[paramName];
    if (targetUserId !== decoded.userId) {
      return res.status(403).json({ message: 'ERROR', data: 'Access denied: you can only access your own data' });
    }

    next();
  };
}

module.exports = { checkPermission, requireAdmin, checkSelfOrAdmin };
