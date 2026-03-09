const assert = require('assert');
const path = require('path');

function chainable(result) {
  return {
    sort() { return this; },
    skip() { return this; },
    limit() { return Promise.resolve(result); },
  };
}

const FakeDeviceLog = {
  find(query) { FakeDeviceLog.lastFind = query; return chainable(FakeDeviceLog.findResult || []); },
  countDocuments(query) { FakeDeviceLog.lastCount = query; return Promise.resolve(FakeDeviceLog.countResult || 0); },
  findResult: null,
  countResult: 0,
};

const modelPath = path.join(__dirname, '..', 'src/models', 'deviceLogModel.js');
require.cache[modelPath] = { exports: FakeDeviceLog };

const controllerPath = path.join(__dirname, '..', 'src/controllers', 'deviceLogController.js');
delete require.cache[controllerPath];

const { getDeviceLogs, getDeviceOnlineHistory } = require('../src/controllers/deviceLogController');

function resMock() {
  return { statusCode: 200, data: null, status(c) { this.statusCode = c; return this; }, json(d) { this.data = d; } };
}

(async () => {
  // getDeviceLogs without pagination
  FakeDeviceLog.findResult = [{ _id: 'l1', event: 'online' }];
  let res = resMock();
  await getDeviceLogs({ params: { device_id: 'd1' }, query: {} }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeDeviceLog.lastFind.device_id, 'd1');

  // getDeviceOnlineHistory
  FakeDeviceLog.findResult = [{ _id: 'l1', event: 'online' }, { _id: 'l2', event: 'offline' }];
  res = resMock();
  await getDeviceOnlineHistory({ params: { device_id: 'd1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.deepStrictEqual(FakeDeviceLog.lastFind.event, { $in: ['online', 'offline'] });

  console.log('deviceLogController tests passed');
})().catch(err => { console.error(err); process.exit(1); });
