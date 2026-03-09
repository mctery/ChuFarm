const assert = require('assert');
const path = require('path');

const FakeModel = {
  findQuery:null,
  async find(q){ this.findQuery=q; return [{_id:'1'}]; },
  async create(d){ this.created=d; return d; },
  async findOneAndUpdate(q, u, opts){ this.updated={q, u}; return { device_id:q.device_id }; }
};

const modelPath = path.join(__dirname,'..','src/models','sensorWidgetModel.js');
require.cache[modelPath] = { exports: FakeModel };

const { getSensorWidget, createSensorWidget, updateSensorWidget, deleteSensorWidget } = require('../src/controllers/sensorWidgetController');

function resMock(){ return { statusCode:200,data:null,status(c){this.statusCode=c;return this;},json(d){this.data=d;} }; }

async function run(){
  let req={ params:{device_id:'d1'} }; let res=resMock();
  await getSensorWidget(req,res);
  assert.deepStrictEqual(FakeModel.findQuery,{ device_id:'d1'});

  req={ body:{ foo:'bar' } }; res=resMock();
  await createSensorWidget(req,res);
  assert.deepStrictEqual(FakeModel.created,{ foo:'bar' });
  assert.strictEqual(res.statusCode, 201);

  req={ params:{device_id:'d2'}, body:{ w:1 } }; res=resMock();
  await updateSensorWidget(req,res);
  assert.deepStrictEqual(FakeModel.updated,{ q:{device_id:'d2'}, u:{ widget_json: JSON.stringify({ w:1 }) } });

  req={ params:{device_id:'d3'} }; res=resMock();
  await deleteSensorWidget(req,res);
  assert.deepStrictEqual(FakeModel.updated,{ q:{device_id:'d3'}, u:{ status:'D' } });

  console.log('sensorWidgetController tests passed');
}

run().catch(err=>{ console.error(err); process.exit(1); });
