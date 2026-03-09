const express = require('express');
const {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  getScheduleExecutionLogs,
} = require('../controllers/scheduleController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const {
  createScheduleSchema,
  updateScheduleSchema,
} = require('../validations/scheduleValidation');

const router = express.Router();

router.use(verifyToken);

router.get('/', checkPermission('schedules:read'), getSchedules);
router.post('/', checkPermission('schedules:write'), validate(createScheduleSchema), createSchedule);

router.get('/:id', checkPermission('schedules:read'), getSchedule);
router.put('/:id', checkPermission('schedules:write'), validate(updateScheduleSchema), updateSchedule);
router.delete('/:id', checkPermission('schedules:delete'), deleteSchedule);
router.post('/:id/toggle', checkPermission('schedules:write'), toggleSchedule);
router.get('/:id/logs', checkPermission('schedules:read'), getScheduleExecutionLogs);

module.exports = router;
