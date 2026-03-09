const assert = require('assert');
const path = require('path');

let axiosCall = null;
const fakeAxios = {
  async get(url){ axiosCall = url; return { data:{ dt:1 } }; }
};

const axiosPath = require.resolve('axios');
require.cache[axiosPath] = { exports: { default: fakeAxios } };
process.env.OPEN_WEATHER_KEY = 'k';

// Must load config before weatherController (it imports config)
const configPath = path.join(__dirname, '..', 'src/config', 'index.js');
require.cache[configPath] = {
  exports: {
    weatherCacheTTL: 3600,
    WEATHER_CACHE_CLEANUP_MS: 10 * 60 * 1000,
    STATUS: { ACTIVE: 'A', DELETED: 'D' },
    QUERY_LIMITS: { default: 20, auditLogs: 50, deviceLogs: 50, onlineHistory: 100, adminUsersMax: 100 },
  },
};

const { getWeatherNow, getWeatherNowAll } = require('../src/controllers/weatherController');

function resMock(){ return { statusCode:200,data:null,status(c){this.statusCode=c;return this;},json(d){this.data=d;} }; }

async function run(){
  let req={ params:{ city:'bangkok' } }; let res=resMock();
  await getWeatherNow(req,res);
  assert.ok(axiosCall.includes('bangkok'));
  assert.ok(res.data.data); // { message: 'OK', data: weatherData }

  const resAll = resMock();
  await getWeatherNowAll({},resAll);
  assert.ok(resAll.data.data.bangkok); // { message: 'OK', data: { bangkok: ... } }

  console.log('weatherController tests passed');
}

run().catch(err=>{ console.error(err); process.exit(1); });
