const assert = require('assert');
const path = require('path');

const FakeModel = {
  query:null,
  async find(q){ this.query=q; return [{_id:'1'}]; }
};

const modelPath = path.join(__dirname,'..','src/models','sensorDataModel.js');
require.cache[modelPath] = { exports: FakeModel };

// Clear cached controller so it picks up our FakeModel
const controllerPath = path.join(__dirname,'..','src/controllers','sensorDataController.js');
delete require.cache[controllerPath];

const { getSensorDataRange } = require('../src/controllers/sensorDataController');

function resMock(){ return { statusCode:200,data:null,status(c){this.statusCode=c;return this;},json(d){this.data=d;} }; }

async function run(){
  const req = { body:{ device_id:'d1', sensor:'temp', startDate:'2020-01-01', endDate:'2020-01-02' } };
  const res = resMock();
  await getSensorDataRange(req,res);
  assert.strictEqual(res.statusCode,200);
  assert.ok(FakeModel.query.createdAt.$gte);
  assert.ok(FakeModel.query.createdAt.$lte);
  console.log('sensorDataRange tests passed');
}

run().catch(err=>{ console.error(err); process.exit(1); });
