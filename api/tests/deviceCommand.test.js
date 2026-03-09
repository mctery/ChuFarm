const assert = require('assert');
const path = require('path');

let publishCall=null;
const fakeMqtt = {
  connect(url){ return { publish(topic,msg){ publishCall={url,topic,msg}; } }; }
};
const mqttPath = require.resolve('mqtt');
require.cache[mqttPath] = { exports: fakeMqtt };

const deviceModelPath = path.join(__dirname,'..','src/models','deviceModel.js');
require.cache[deviceModelPath] = { exports:{} };
const widgetModelPath = path.join(__dirname,'..','src/models','sensorWidgetModel.js');
require.cache[widgetModelPath] = { exports:{} };

const { sendDeviceCommand, setCommandClient } = require('../src/controllers/deviceController');

function resMock(){ return { statusCode:200,data:null,status(c){this.statusCode=c;return this;},json(d){this.data=d;} }; }

async function run(){
  process.env.MQTT_URL='mqtt://localhost';
  setCommandClient(fakeMqtt.connect(process.env.MQTT_URL));
  const req={ params:{ id:'d1' }, body:{ command:'timeinput', payload:{ a:1 } } };
  const res=resMock();
  await sendDeviceCommand(req,res);
  assert.strictEqual(res.statusCode,200);
  assert.ok(publishCall.topic.includes('d1'));
  console.log('deviceCommand tests passed');
}

run().catch(err=>{ console.error(err); process.exit(1); });
