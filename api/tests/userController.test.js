const assert = require('assert');
const path = require('path');

// Mock User model
function chainable(result) {
  return { select() { return Promise.resolve(result); } };
}
const FakeUser = {
  findByIdAndUpdate(id, info, opts) {
    FakeUser.lastUpdate = { id, info };
    const result = (opts && opts.new) ? { _id: id, ...info } : { _id: id };
    return chainable(result);
  },
  findById(id) {
    return chainable({ _id: id, ...(FakeUser.lastUpdate ? FakeUser.lastUpdate.info : {}) });
  },
  lastUpdate: null,
};

// Mock bcrypt
let hashCalls = 0;
const bcrypt = {
  async hash(password) {
    hashCalls++;
    return 'hashed:' + password;
  },
};

// Mock Menu and UserMenu models (needed because userController imports menuController)
const FakeMenu = {
  findCalls: [],
  async find(q) { this.findCalls.push(q); return [{ _id: '1', toObject() { return { _id: '1', order: 0, parent_id: null }; } }]; },
  async findById(id) { return { _id: id }; },
  async create(data) { return data; },
  async findByIdAndUpdate(id, data, opts) { return { _id: id, ...data }; },
};
const FakeUserMenu = {
  async findOne() { return null; },
  async create(data) { return data; },
};
const FakePermission = {
  async findOne() { return null; },
  async create(data) { return data; },
};

// Patch require cache before loading controller
const userModelPath = path.join(__dirname, '..', 'src/models', 'userModel.js');
const menuModelPath = path.join(__dirname, '..', 'src/models', 'menuModel.js');
const userMenuModelPath = path.join(__dirname, '..', 'src/models', 'userMenuModel.js');
const permissionModelPath = path.join(__dirname, '..', 'src/models', 'permissionModel.js');
require.cache[userModelPath] = { exports: FakeUser };
require.cache[menuModelPath] = { exports: FakeMenu };
require.cache[userMenuModelPath] = { exports: FakeUserMenu };
require.cache[permissionModelPath] = { exports: FakePermission };
const bcryptPath = require.resolve('bcrypt');
require.cache[bcryptPath] = { exports: bcrypt };

const { updateUser } = require('../src/controllers/userController');

async function runUpdate(body) {
  const req = { params: { id: 'id1' }, body };
  const res = {
    statusCode: 0,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; },
  };
  let caught;
  await updateUser(req, res, err => { caught = err; });
  if (caught) throw caught;
  return { res, lastUpdate: FakeUser.lastUpdate };
}

(async () => {
  // Update with password
  hashCalls = 0;
  FakeUser.lastUpdate = null;
  await runUpdate({ first_name: 'A', password: 'secret' });
  assert.strictEqual(hashCalls, 1, 'password should be hashed');
  assert.strictEqual(FakeUser.lastUpdate.info.password, 'hashed:secret');

  // Update without password
  hashCalls = 0;
  FakeUser.lastUpdate = null;
  await runUpdate({ first_name: 'B' });
  assert.strictEqual(hashCalls, 0, 'hash should not be called');
  assert.deepStrictEqual(FakeUser.lastUpdate.info, { first_name: 'B' });

  console.log('All tests passed.');
})();
