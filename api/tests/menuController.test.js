const assert = require('assert');
const path = require('path');

const FakeMenu = {
  findCalls: [],
  async find(q){ this.findCalls.push(q); return [{ _id: '1', toObject(){ return { _id: '1', order: 0, parent_id: null }; } }]; },
  async findById(id){ this.lastFind = id; return { _id: id }; },
  async create(data){ this.created = data; return data; },
  async findByIdAndUpdate(id, data, opts){ this.updated = { id, data }; return { _id: id, ...data }; }
};

const FakeUserMenu = {
  async findOne(q){ return FakeUserMenu.result; },
  result: null,
};

const modelPath = path.join(__dirname,'..','src/models','menuModel.js');
const userMenuPath = path.join(__dirname,'..','src/models','userMenuModel.js');
require.cache[modelPath] = { exports: FakeMenu };
require.cache[userMenuPath] = { exports: FakeUserMenu };

const { getMenus, getMenu, createMenu, updateMenu, deleteMenu, getAccessibleMenus } = require('../src/controllers/menuController');

function resMock(){ return { statusCode:200,data:null,status(c){this.statusCode=c;return this;},json(d){this.data=d;} }; }

async function run(){
  let req={}, res=resMock();
  await getMenus(req,res);
  assert.deepStrictEqual(FakeMenu.findCalls[0], { status:'A' });

  req={ params:{ id:'m1' } }; res=resMock();
  await getMenu(req,res);
  assert.strictEqual(FakeMenu.lastFind,'m1');

  req={ body:{ name:'n', path:'/x' } }; res=resMock();
  await createMenu(req,res);
  assert.deepStrictEqual(FakeMenu.created, { name:'n', path:'/x' });
  assert.strictEqual(res.statusCode, 201);

  req={ params:{ id:'m2' }, body:{ name:'u' } }; res=resMock();
  await updateMenu(req,res);
  assert.strictEqual(FakeMenu.updated.id, 'm2');
  assert.strictEqual(FakeMenu.updated.data.name, 'u');

  req={ params:{ id:'m3' } }; res=resMock();
  await deleteMenu(req,res);
  assert.strictEqual(FakeMenu.updated.id, 'm3');

  // Test getAccessibleMenus for admin user
  req={ User_name:{ role:'admin', userId:'u1' } }; res=resMock();
  await getAccessibleMenus(req,res);
  assert.strictEqual(res.data.message, 'OK');
  assert(Array.isArray(res.data.data));

  // Test getAccessibleMenus for regular user with no UserMenu
  FakeUserMenu.result = null;
  req={ User_name:{ role:'user', userId:'u2' } }; res=resMock();
  await getAccessibleMenus(req,res);
  assert.strictEqual(res.data.message, 'OK');
  assert.deepStrictEqual(res.data.data, []);

  console.log('menuController tests passed');
}

run().catch(err=>{ console.error(err); process.exit(1); });
