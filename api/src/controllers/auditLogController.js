const AuditLog = require('../models/auditLogModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { QUERY_LIMITS } = require('../config');
const { paginateQuery } = require('../utils/pagination');

const getAuditLogs = asyncHandler(async (req, res) => {
  logger.debug('getAuditLogs called');
  const filter = {};
  if (req.query?.user_id) filter.user_id = req.query.user_id;
  if (req.query?.resource_type) filter.resource_type = req.query.resource_type;
  if (req.query?.action) filter.action = req.query.action;

  const result = await paginateQuery(AuditLog, filter, req.query, {
    defaultLimit: QUERY_LIMITS.auditLogs,
  });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getAuditLogsByResource = asyncHandler(async (req, res) => {
  logger.debug('getAuditLogsByResource called');
  const { resource_type, resource_id } = req.params;
  const logs = await AuditLog.find({ resource_type, resource_id })
    .sort({ createdAt: -1 })
    .limit(QUERY_LIMITS.auditLogs);
  res.json({ message: 'OK', data: logs });
});

module.exports = {
  getAuditLogs,
  getAuditLogsByResource,
};
