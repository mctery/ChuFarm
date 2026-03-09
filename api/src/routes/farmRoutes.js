const express = require('express');
const {
  getFarms,
  getFarm,
  createFarm,
  updateFarm,
  deleteFarm,
  getFarmStats,
} = require('../controllers/farmController');
const {
  getZonesByFarm,
  createZone,
} = require('../controllers/zoneController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { createFarmSchema, updateFarmSchema } = require('../validations/farmValidation');
const { createZoneSchema } = require('../validations/zoneValidation');

const router = express.Router();

router.use(verifyToken);

router.get('/', checkPermission('farms:read'), getFarms);
router.post('/', checkPermission('farms:write'), validate(createFarmSchema), createFarm);

router.get('/:id', checkPermission('farms:read'), getFarm);
router.put('/:id', checkPermission('farms:write'), validate(updateFarmSchema), updateFarm);
router.delete('/:id', checkPermission('farms:delete'), deleteFarm);
router.get('/:id/stats', checkPermission('farms:read'), getFarmStats);

// Nested zone routes under farm
router.get('/:farm_id/zones', checkPermission('zones:read'), getZonesByFarm);
router.post('/:farm_id/zones', checkPermission('zones:write'), validate(createZoneSchema), createZone);

module.exports = router;
