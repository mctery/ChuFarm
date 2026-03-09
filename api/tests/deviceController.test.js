const assert = require('assert');
const path = require('path');

/** Helper: make a chainable Mongoose-like query that resolves to `result`. */
function chainable(result) {
  const q = {
    sort()  { return q; },
    skip()  { return q; },
    limit() { return q; },
    select(){ return q; },
    lean()  { return q; },
    then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
  };
  return q;
}

const FakeDevice = {
  findCalls: [],
  find(query) { this.findCalls.push(query); return chainable([{_id:'1'}]); },
  async countDocuments() { return 1; },
  async findById(id) { this.lastFindById = id; return { _id: id }; },
  async findOne(query) { return FakeDevice._findOneResult; },
  async create(data) { this.created = data; return data; },
  async findByIdAndUpdate(id, data, opts) { this.updated = {id, data}; return { _id:id, ...data }; },
  _findOneResult: null,
};

const FakeSensorWidget = {
  async create(data) { FakeSensorWidget.created = data; return data; },
  async findOneAndUpdate(query, update) { this.updated = {query, update}; return { device_id: query.device_id }; },
};

const deviceModelPath = path.join(__dirname, '..', 'src/models', 'deviceModel.js');
const widgetModelPath = path.join(__dirname, '..', 'src/models', 'sensorWidgetModel.js');
require.cache[deviceModelPath] = { exports: FakeDevice };
require.cache[widgetModelPath] = { exports: FakeSensorWidget };

const {
  getDevices,
  getDevice,
  getDeviceUser,
  createDevice,
  updateDevice,
  deleteDevice
} = require('../src/controllers/deviceController');

function mockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code){ this.statusCode = code; return this; },
    json(payload){ this.data = payload; }
  };
}

async function run() {
  // getDevices (no pagination params → defaultLimit: 0 → returns all)
  let req = { query: {} }; let res = mockRes();
  await getDevices(req,res);
  assert.deepStrictEqual(FakeDevice.findCalls[0], { status: 'A' });
  assert.strictEqual(res.statusCode, 200);

  // getDevice (by ObjectId-like id)
  req = { params:{id:'507f1f77bcf86cd799439011'} }; res = mockRes();
  await getDevice(req,res);
  assert.strictEqual(FakeDevice.lastFindById,'507f1f77bcf86cd799439011');

  // getDevice (by device_id string)
  FakeDevice._findOneResult = { _id: 'x', device_id: 'dev1' };
  req = { params:{id:'dev1'} }; res = mockRes();
  await getDevice(req,res);
  assert.strictEqual(res.data.data.device_id, 'dev1');
  FakeDevice._findOneResult = null;

  // getDeviceUser
  req = { params:{user_id:'u1'}, query: {} }; res = mockRes();
  await getDeviceUser(req,res);
  assert.deepStrictEqual(FakeDevice.findCalls[1], { user_id:'u1', status:'A' });

  // createDevice
  FakeDevice._findOneResult = null;
  req = { body:{ device_id:'d1', name:'n', user_id:'u1' } }; res = mockRes();
  await createDevice(req,res);
  assert.deepStrictEqual(FakeDevice.created, { device_id:'d1', name:'n', user_id:'u1', status:'A' });
  assert.deepStrictEqual(FakeSensorWidget.created, { device_id:'d1' });
  assert.strictEqual(res.statusCode, 201);

  // updateDevice
  req = { params:{id:'d1'}, body:{ name:'new' } }; res = mockRes();
  await updateDevice(req,res);
  assert.strictEqual(FakeDevice.updated.id, 'd1');
  assert.strictEqual(FakeDevice.updated.data.name, 'new');

  // deleteDevice
  req = { params:{id:'d2'} }; res = mockRes();
  await deleteDevice(req,res);
  assert.strictEqual(FakeDevice.updated.id, 'd2');

  console.log('deviceController tests passed');
}

run().catch(err => { console.error(err); process.exit(1); });
