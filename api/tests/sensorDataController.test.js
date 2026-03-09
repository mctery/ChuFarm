const assert = require('assert');
const path = require('path');

const FakeModel = {
  findQuery: null,
  created:null,
  async find(q){ this.findQuery=q; return [{_id:'1'}]; },
  async create(data){ this.created=data; return data; }
};

const modelPath = path.join(__dirname,'..','src/models','sensorDataModel.js');
require.cache[modelPath] = { exports: FakeModel };

const { getSensorData, createSensorDataValue } = require('../src/controllers/sensorDataController');

function resMock(){ return { statusCode:200,data:null,status(c){this.statusCode=c;return this;},json(d){this.data=d;} }; }

async function run(){
  let req = { body:{ device_id:'d1', sensor:'temp' } }; let res = resMock();
  await getSensorData(req,res);
  assert.deepStrictEqual(FakeModel.findQuery,{ device_id:'d1', sensor:'temp' });

  req = { body:{ device_id:'d1', dataset:[{id:'1',sensor:'temp',value:10}] } };
  res = resMock();
  await createSensorDataValue(req,res);
  assert.strictEqual(Array.isArray(FakeModel.created),true);
  assert.deepStrictEqual(FakeModel.created[0], { device_id:'d1', sensor_id:'1', sensor:'temp', value:10 });
  assert.strictEqual(res.statusCode, 201);

  console.log('sensorDataController tests passed');
}

run().catch(err=>{ console.error(err); process.exit(1); });
