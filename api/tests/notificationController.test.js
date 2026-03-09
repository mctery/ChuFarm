const assert = require('assert');
const path = require('path');

// Chainable mock for Mongoose queries
function chainable(result) {
  return {
    sort() { return this; },
    skip() { return this; },
    limit() { return Promise.resolve(result); },
  };
}

const FakeNotification = {
  find(query) { FakeNotification.lastFind = query; return chainable(FakeNotification.findResult || []); },
  countDocuments(query) { FakeNotification.lastCount = query; return Promise.resolve(FakeNotification.countResult || 0); },
  findByIdAndUpdate(id, data, opts) { FakeNotification.lastUpdate = { id, data }; return Promise.resolve({ _id: id, ...data }); },
  updateMany(filter, data) { FakeNotification.lastUpdateMany = { filter, data }; return Promise.resolve(); },
  findByIdAndDelete(id) { FakeNotification.lastDelete = id; return Promise.resolve({ _id: id }); },
  findResult: null,
  countResult: 0,
};

const modelPath = path.join(__dirname, '..', 'src/models', 'notificationModel.js');
require.cache[modelPath] = { exports: FakeNotification };

const controllerPath = path.join(__dirname, '..', 'src/controllers', 'notificationController.js');
delete require.cache[controllerPath];

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../src/controllers/notificationController');

function resMock() {
  return { statusCode: 200, data: null, status(c) { this.statusCode = c; return this; }, json(d) { this.data = d; } };
}

(async () => {
  // getNotifications
  FakeNotification.findResult = [{ _id: '1' }];
  let res = resMock();
  await getNotifications({ params: { user_id: 'u1' }, query: {} }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeNotification.lastFind.user_id, 'u1');

  // getUnreadCount
  FakeNotification.countResult = 5;
  res = resMock();
  await getUnreadCount({ params: { user_id: 'u1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(res.data.data.count, 5);

  // markAsRead
  res = resMock();
  await markAsRead({ params: { id: 'n1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeNotification.lastUpdate.id, 'n1');
  assert.strictEqual(FakeNotification.lastUpdate.data.is_read, true);

  // markAllAsRead
  res = resMock();
  await markAllAsRead({ params: { user_id: 'u1' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeNotification.lastUpdateMany.filter.user_id, 'u1');

  // deleteNotification
  res = resMock();
  await deleteNotification({ params: { id: 'n2' } }, res);
  assert.strictEqual(res.data.message, 'OK');
  assert.strictEqual(FakeNotification.lastDelete, 'n2');

  console.log('notificationController tests passed');
})().catch(err => { console.error(err); process.exit(1); });
