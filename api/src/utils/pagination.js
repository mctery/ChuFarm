const { STATUS } = require('../config');

const MAX_LIMIT = 500;

/**
 * Parse pagination params from query string.
 * Returns { page, limit, skip } or null if pagination is not requested.
 */
function parsePagination(query, defaultLimit = 20) {
  const page = parseInt(query?.page, 10) || 0;
  let limit = parseInt(query?.limit, 10) || defaultLimit;

  // Enforce maximum limit to prevent abuse
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  if (page > 0 && limit > 0) {
    return { page, limit, skip: (page - 1) * limit };
  }
  return null;
}

/**
 * Build standard pagination response object.
 */
function paginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

/**
 * Execute a paginated or unpaginated Mongoose query with standard response.
 * @param {Model} model     - Mongoose model
 * @param {Object} filter   - Query filter
 * @param {Object} query    - req.query (for page/limit)
 * @param {Object} options  - { defaultLimit, sort, select, populate }
 */
async function paginateQuery(model, filter, query, options = {}) {
  const { defaultLimit = 20, sort = { createdAt: -1 }, select, populate } = options;
  const pg = parsePagination(query, defaultLimit);

  if (pg) {
    const [data, total] = await Promise.all([
      applyOptions(model.find(filter), { sort, select, populate }).skip(pg.skip).limit(pg.limit),
      model.countDocuments(filter),
    ]);
    return { data, pagination: paginationMeta(pg.page, pg.limit, total) };
  }

  let q = applyOptions(model.find(filter), { sort, select, populate });
  // Even unpaginated queries get a safety cap
  const cap = defaultLimit > 0 ? Math.min(defaultLimit, MAX_LIMIT) : MAX_LIMIT;
  q = q.limit(cap);
  const data = await q;
  return { data };
}

function applyOptions(q, { sort, select, populate }) {
  if (sort) q = q.sort(sort);
  if (select) q = q.select(select);
  if (populate) q = q.populate(populate);
  return q;
}

/**
 * Normalize boolean/undefined status to STATUS.ACTIVE or STATUS.DELETED.
 */
function normalizeStatus(value) {
  if (typeof value === 'boolean') return value ? STATUS.ACTIVE : STATUS.DELETED;
  if (!value) return STATUS.ACTIVE;
  return value;
}

/**
 * Find device by MongoDB _id or device_id string.
 */
async function findDeviceFlexible(Device, id) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  if (isObjectId) return Device.findById(id);
  return Device.findOne({ device_id: id, status: STATUS.ACTIVE });
}

module.exports = { parsePagination, paginationMeta, paginateQuery, normalizeStatus, findDeviceFlexible };
