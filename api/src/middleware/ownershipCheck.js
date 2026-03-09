const Device = require('../models/deviceModel');
const User = require('../models/userModel');
const getUserId = require('../utils/getUserId');
const { findDeviceFlexible } = require('../utils/pagination');

/**
 * Middleware that verifies the authenticated user owns the device.
 *
 * Resolves ownership: JWT email -> User lookup -> user_id match against Device.user_id
 * Admins bypass ownership check but device is still resolved for downstream handlers.
 *
 * @param {'params'|'body'} idSource - Where to find device identifier
 *   - 'params': looks for req.params.id, req.params.device_id, or req.params.deviceId
 *   - 'body': looks for req.body.device_id
 *
 * Must be placed AFTER verifyToken middleware.
 */
function checkDeviceOwnership(idSource = 'params') {
  return async (req, res, next) => {
    try {
      const email = req.User_name && req.User_name.user;
      if (!email) {
        return res.status(401).json({ message: 'ERROR', data: 'Authentication required' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'ERROR', data: 'User not found' });
      }

      let deviceIdentifier;
      if (idSource === 'params') {
        deviceIdentifier = req.params.id || req.params.device_id || req.params.deviceId;
      } else {
        deviceIdentifier = req.body.device_id;
      }

      if (!deviceIdentifier) {
        return res.status(400).json({ message: 'ERROR', data: 'Device identifier required' });
      }

      // Try by MongoDB _id first (routes using /:id), then by device_id string
      const device = idSource === 'params'
        ? await findDeviceFlexible(Device, deviceIdentifier)
        : await Device.findOne({ device_id: deviceIdentifier });

      if (!device) {
        return res.status(404).json({ message: 'ERROR', data: 'Device not found' });
      }

      // Admin bypass — admins can access any device
      const role = req.User_name && req.User_name.role;
      if (role === 'admin') {
        req.authenticatedUser = user;
        req.device = device;
        return next();
      }

      const userIdStr = getUserId(user);
      if (device.user_id !== userIdStr) {
        return res.status(403).json({ message: 'ERROR', data: 'Access denied: device does not belong to you' });
      }

      req.authenticatedUser = user;
      req.device = device;
      next();
    } catch (err) {
      return res.status(500).json({ message: 'ERROR', data: 'Ownership verification failed' });
    }
  };
}

module.exports = { checkDeviceOwnership };
