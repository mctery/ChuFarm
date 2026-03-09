const assert = require('assert');
const path = require('path');

function chainable(result) {
  return {
    sort() { return this; },
    skip() { return this; },
    limit() { return Promise.resolve(result); },
  };
}

const FakeAuditLog = {
  find(query) { FakeAuditLog.lastFind = query; return chainable(FakeAuditLog.findResult || []); },
  countDocuments(query) { FakeAuditLog.lastCount = query; return Promise.resolve(FakeAuditLog.countResult || 0); },
  findResult: null,
  countResult: 0,
};

const modelPath = path.join(__dirname, '..', 'src/models', 'auditLogModel.js');
require.cache[modelPath] = { exports: FakeAuditLog };

const controllerPath = path.join(__dirname, '..', 'src/controllers', 'auditLogController.js');
delete require.cache[controllerPath];

const { getAuditLogs, getAuditLogsByResource } = require('../src/controllers/auditLogController');

function resMock() {
  return { statusCode: 200, data: null, status(c) { this.statusCode = c; return this; }, json(d) { this.data = d; } };
}

(async () => {
  // getAuditLogs with pagination
  FakeAuditLog.findResult = [{ _id: 'a1', action: 'create' }];
  FakeAuditLog.countResult = 1;
  let res = resMock();
  await getAuditLogs({ query: { page: '1', limit: '20' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.ok(res.data.pagination);
  assert.strictEqual(res.data.pagination.page, 1);

  // getAuditLogs with filters
  res = resMock();
  await getAuditLogs({ query: { user_id: 'u1', action: 'delete' } }, res);
  assert.strictEqual(FakeAuditLog.lastFind.user_id, 'u1');
  assert.strictEqual(FakeAuditLog.lastFind.action, 'delete');

  // getAuditLogsByResource
  FakeAuditLog.findResult = [{ _id: 'a2' }];
  res = resMock();
  await getAuditLogsByResource({ params: { resource_type: 'device', resource_id: 'd1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeAuditLog.lastFind.resource_type, 'device');
  assert.strictEqual(FakeAuditLog.lastFind.resource_id, 'd1');

  console.log('auditLogController tests passed');
})().catch(err => { console.error(err); process.exit(1); });
