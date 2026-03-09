const AuditLog = require('../models/auditLogModel');
const User = require('../models/userModel');
const logger = require('../config/logger');

/**
 * Middleware that logs user actions to AuditLog collection.
 *
 * @param {string} action - 'create' | 'update' | 'delete'
 * @param {string} resourceType - 'device' | 'sensor' | 'group' | etc.
 * @param {'params'|'body'} idSource - Where to find resource_id
 */
function auditLog(action, resourceType, idSource = 'params') {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      // Only log successful operations (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const email = req.User_name && req.User_name.user;
          let userId = 'unknown';

          if (email) {
            const user = await User.findOne({ email }).select('_id');
            if (user) userId = String(user._id);
          }

          const resourceId =
            idSource === 'params'
              ? req.params.id || req.params.device_id || ''
              : req.body.device_id || req.body._id || '';

          await AuditLog.create({
            user_id: userId,
            action,
            resource_type: resourceType,
            resource_id: String(resourceId),
            changes: action === 'create' || action === 'update' ? req.body : {},
            ip_address: req.ip || req.connection?.remoteAddress,
          });
        } catch (err) {
          logger.error('Audit log error', { error: err.message });
        }
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = { auditLog };
