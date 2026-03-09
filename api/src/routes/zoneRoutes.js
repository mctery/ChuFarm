const express = require('express');
const {
  getZone,
  updateZone,
  deleteZone,
} = require('../controllers/zoneController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { updateZoneSchema } = require('../validations/zoneValidation');

const router = express.Router();

router.use(verifyToken);

router.get('/:id', checkPermission('zones:read'), getZone);
router.put('/:id', checkPermission('zones:write'), validate(updateZoneSchema), updateZone);
router.delete('/:id', checkPermission('zones:delete'), deleteZone);

module.exports = router;
