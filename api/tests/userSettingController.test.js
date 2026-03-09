const assert = require('assert');
const path = require('path');

const FakeUserSetting = {
  findOne(query) { FakeUserSetting.lastFindOne = query; return Promise.resolve(FakeUserSetting.findOneResult); },
  create(data) { FakeUserSetting.created = data; return Promise.resolve({ _id: 'us1', ...data }); },
  findOneAndUpdate(filter, data, opts) {
    FakeUserSetting.lastUpdate = { filter, data };
    return Promise.resolve({ _id: 'us1', ...filter, ...data });
  },
  findOneResult: null,
};

const modelPath = path.join(__dirname, '..', 'src/models', 'userSettingModel.js');
require.cache[modelPath] = { exports: FakeUserSetting };

const controllerPath = path.join(__dirname, '..', 'src/controllers', 'userSettingController.js');
delete require.cache[controllerPath];

const { getUserSetting, updateUserSetting } = require('../src/controllers/userSettingController');

function resMock() {
  return { statusCode: 200, data: null, status(c) { this.statusCode = c; return this; }, json(d) { this.data = d; } };
}

(async () => {
  // getUserSetting — existing setting
  FakeUserSetting.findOneResult = { _id: 'us1', user_id: 'u1', language: 'th' };
  let res = resMock();
  await getUserSetting({ params: { user_id: 'u1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(res.data.data.user_id, 'u1');

  // getUserSetting — auto-create when not found
  FakeUserSetting.findOneResult = null;
  res = resMock();
  await getUserSetting({ params: { user_id: 'u2' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeUserSetting.created.user_id, 'u2');

  // updateUserSetting
  res = resMock();
  await updateUserSetting({ params: { user_id: 'u1' }, body: { language: 'en' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeUserSetting.lastUpdate.filter.user_id, 'u1');
  assert.strictEqual(FakeUserSetting.lastUpdate.data.language, 'en');

  console.log('userSettingController tests passed');
})().catch(err => { console.error(err); process.exit(1); });
