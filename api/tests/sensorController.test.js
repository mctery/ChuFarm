const assert = require('assert');
const path = require('path');

const FakeSensor = {
  findCalls: [],
  async find(query){ this.findCalls.push(query); return [{_id:'1'}]; },
  async findById(id){ this.lastFindById = id; return { _id:id }; },
  async create(data){ this.created = data; return data; },
  async findByIdAndUpdate(id, data, opts){ this.updated = {id, data}; return { _id:id, ...data }; },
  async findByIdAndDelete(id){ this.deleted = id; return { _id:id }; },
};

const modelPath = path.join(__dirname,'..','src/models','sensorModel.js');
require.cache[modelPath] = { exports: FakeSensor };

const controllerPath = path.join(__dirname,'..','src/controllers','sensorController.js');
delete require.cache[controllerPath];

const {
  getSensors,
  getSensor,
  getDeviceSensor,
  createSensor,
  updateSensor,
  deleteSensor
} = require('../src/controllers/sensorController');

function resMock(){
  return {
    statusCode: 200,
    data: null,
    status(c){ this.statusCode=c; return this; },
    json(d){ this.data=d; }
  };
}

async function run(){
  let req = {}; let res = resMock();
  await getSensors(req,res);
  assert.deepStrictEqual(FakeSensor.findCalls[0],{ status: 'A' });
  assert.strictEqual(res.data.message, 'OK');
  assert.ok(Array.isArray(res.data.data));

  req = {params:{id:'s1'}}; res = resMock();
  await getSensor(req,res);
  assert.strictEqual(FakeSensor.lastFindById,'s1');
  assert.strictEqual(res.data.message, 'OK');

  req = {params:{id:'d1',type:'t1'}}; res = resMock();
  await getDeviceSensor(req,res);
  assert.deepStrictEqual(FakeSensor.findCalls[1],{ device_id:'d1', sensor_type:'t1', status: 'A' });
  assert.strictEqual(res.data.message, 'OK');

  req = {body:{ foo:'bar' }}; res = resMock();
  await createSensor(req,res);
  assert.strictEqual(FakeSensor.created.foo, 'bar');
  assert.strictEqual(FakeSensor.created.status, 'A', 'createSensor should default status to A');
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.data.message, 'OK');

  // createSensor with boolean status should convert to string
  req = {body:{ device_id:'d1', sensor_type:'temperature', status: false }}; res = resMock();
  await createSensor(req,res);
  assert.strictEqual(FakeSensor.created.status, 'D', 'boolean false should become D');

  req = {params:{id:'s1'}, body:{ value:1 }}; res = resMock();
  await updateSensor(req,res);
  assert.strictEqual(FakeSensor.updated.id, 's1');
  assert.strictEqual(FakeSensor.updated.data.value, 1);
  assert.strictEqual(res.data.message, 'OK');

  // updateSensor with boolean status should convert to string
  req = {params:{id:'s1'}, body:{ status: true }}; res = resMock();
  await updateSensor(req,res);
  assert.strictEqual(FakeSensor.updated.data.status, 'A', 'boolean true should become A');

  // deleteSensor now uses soft delete (findByIdAndUpdate with status: 'D')
  req = {params:{id:'s2'}}; res = resMock();
  await deleteSensor(req,res);
  assert.strictEqual(FakeSensor.updated.id, 's2');
  assert.deepStrictEqual(FakeSensor.updated.data, { status: 'D' });
  assert.strictEqual(res.data.message, 'OK');

  console.log('sensorController tests passed');
}

run().catch(err=>{ console.error(err); process.exit(1); });
