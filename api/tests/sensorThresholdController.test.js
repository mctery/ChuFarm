const assert = require('assert');
const path = require('path');

const FakeThreshold = {
  find(query) { FakeThreshold.lastFind = query; return Promise.resolve(FakeThreshold.findResult || []); },
  create(data) { FakeThreshold.created = data; return Promise.resolve({ _id: 't1', ...data }); },
  findByIdAndUpdate(id, data, opts) { FakeThreshold.lastUpdate = { id, data }; return Promise.resolve({ _id: id, ...data }); },
  findResult: null,
};

const modelPath = path.join(__dirname, '..', 'src/models', 'sensorThresholdModel.js');
require.cache[modelPath] = { exports: FakeThreshold };

const controllerPath = path.join(__dirname, '..', 'src/controllers', 'sensorThresholdController.js');
delete require.cache[controllerPath];

const {
  getThresholdsByDevice,
  getThresholdsByUser,
  createThreshold,
  updateThreshold,
  deleteThreshold,
} = require('../src/controllers/sensorThresholdController');

function resMock() {
  return { statusCode: 200, data: null, status(c) { this.statusCode = c; return this; }, json(d) { this.data = d; } };
}

(async () => {
  // getThresholdsByDevice
  FakeThreshold.findResult = [{ _id: 't1' }];
  let res = resMock();
  await getThresholdsByDevice({ params: { device_id: 'd1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeThreshold.lastFind.device_id, 'd1');
  assert.strictEqual(FakeThreshold.lastFind.is_active, true);

  // getThresholdsByUser
  res = resMock();
  await getThresholdsByUser({ params: { user_id: 'u1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeThreshold.lastFind.user_id, 'u1');

  // createThreshold
  res = resMock();
  await createThreshold({ body: { sensor_id: 's1', device_id: 'd1', min_value: 10, max_value: 40 } }, res);
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeThreshold.created.sensor_id, 's1');

  // updateThreshold
  res = resMock();
  await updateThreshold({ params: { id: 't1' }, body: { max_value: 50 } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeThreshold.lastUpdate.id, 't1');

  // deleteThreshold (soft delete via is_active: false)
  res = resMock();
  await deleteThreshold({ params: { id: 't1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeThreshold.lastUpdate.data.is_active, false);

  console.log('sensorThresholdController tests passed');
})().catch(err => { console.error(err); process.exit(1); });
