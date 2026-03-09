const express = require('express');
const {
  getWeatherNow,
  getWeatherNowAll,
} = require('../controllers/weatherController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { cityParamSchema } = require('../validations/weatherValidation');

const router = express.Router();

router.use(verifyToken);

router.route('/').get(checkPermission('weather:read'), getWeatherNowAll);
router.route('/:city').get(checkPermission('weather:read'), validate(cityParamSchema, 'params'), getWeatherNow);

module.exports = router;
