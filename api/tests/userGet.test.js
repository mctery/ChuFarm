const assert = require('assert');
const path = require('path');

function chainable(result) {
  return { select() { return Promise.resolve(result); } };
}
const FakeUser = {
  find(query){ FakeUser.lastFind = query; return chainable([{ _id:'1' }]); },
  findById(id){ FakeUser.lastFindById = id; return chainable({ _id:id }); }
};

const userModelPath = path.join(__dirname,'..','src/models','userModel.js');
require.cache[userModelPath] = { exports: FakeUser };

// Clear cached controller so it picks up our FakeUser
const controllerPath = path.join(__dirname,'..','src/controllers','userController.js');
delete require.cache[controllerPath];

const { getUsers, getUser } = require('../src/controllers/userController');

function resMock(){ return { statusCode:200,data:null,status(c){this.statusCode=c;return this;},json(d){this.data=d;} }; }

(async ()=>{
  let res=resMock();
  await getUsers({},res);
  assert.deepStrictEqual(FakeUser.lastFind,{ status:'A' });
  assert.strictEqual(res.statusCode,200);

  res=resMock();
  await getUser({ params:{ id:'u1' } },res);
  assert.strictEqual(FakeUser.lastFindById,'u1');
  assert.strictEqual(res.statusCode,200);
  console.log('user get tests passed');
})().catch(err=>{ console.error(err); process.exit(1); });
