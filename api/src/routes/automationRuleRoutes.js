const express = require('express');
const {
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  testRule,
  getRuleExecutionLogs,
} = require('../controllers/automationRuleController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const {
  createRuleSchema,
  updateRuleSchema,
  testRuleSchema,
} = require('../validations/automationRuleValidation');

const router = express.Router();

router.use(verifyToken);

router.get('/', checkPermission('rules:read'), getRules);
router.post('/', checkPermission('rules:write'), validate(createRuleSchema), createRule);

router.get('/:id', checkPermission('rules:read'), getRule);
router.put('/:id', checkPermission('rules:write'), validate(updateRuleSchema), updateRule);
router.delete('/:id', checkPermission('rules:delete'), deleteRule);
router.post('/:id/toggle', checkPermission('rules:write'), toggleRule);
router.post('/:id/test', checkPermission('rules:write'), validate(testRuleSchema), testRule);
router.get('/:id/logs', checkPermission('rules:read'), getRuleExecutionLogs);

module.exports = router;
