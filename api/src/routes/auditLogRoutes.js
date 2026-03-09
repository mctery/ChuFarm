const express = require('express');
const {
  getAuditLogs,
  getAuditLogsByResource,
} = require('../controllers/auditLogController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(verifyToken);

router.get('/', checkPermission('audit_logs:read'), getAuditLogs);
router.get('/:resource_type/:resource_id', checkPermission('audit_logs:read'), getAuditLogsByResource);

module.exports = router;
