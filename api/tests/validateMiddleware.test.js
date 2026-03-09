const assert = require('assert');
const validate = require('../src/middleware/validate');
const {
  registerSchema,
  loginSchema,
} = require('../src/validations/userValidation');
const {
  sendCommandSchema,
} = require('../src/validations/deviceValidation');

function mockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.data = payload; },
  };
}

(async () => {
  const middleware = validate(loginSchema);

  // Test: valid input passes
  {
    const req = { body: { email: 'test@test.com', password: '12345678' } };
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'next() should be called for valid input');
  }

  // Test: invalid input returns 400
  {
    const req = { body: { email: 'not-email', password: '' } };
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'next() should not be called for invalid input');
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.data.message, 'Validation Error');
    assert.ok(Array.isArray(res.data.errors));
  }

  // Test: stripUnknown removes extra fields
  {
    const req = { body: { email: 'test@test.com', password: '12345678', admin: true } };
    const res = mockRes();
    middleware(req, res, () => {});
    assert.strictEqual(req.body.admin, undefined, 'unknown fields should be stripped');
  }

  // Test: password strength - too short
  {
    const regMiddleware = validate(registerSchema);
    const req = { body: { first_name: 'John', last_name: 'Doe', email: 'j@e.com', password: 'Aa1' } };
    const res = mockRes();
    let nextCalled = false;
    regMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'short password should fail');
    assert.strictEqual(res.statusCode, 400);
  }

  // Test: password strength - no uppercase
  {
    const regMiddleware = validate(registerSchema);
    const req = { body: { first_name: 'John', last_name: 'Doe', email: 'j@e.com', password: 'weakpass1' } };
    const res = mockRes();
    let nextCalled = false;
    regMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'password without uppercase should fail');
  }

  // Test: password strength - no number
  {
    const regMiddleware = validate(registerSchema);
    const req = { body: { first_name: 'John', last_name: 'Doe', email: 'j@e.com', password: 'WeakPasss' } };
    const res = mockRes();
    let nextCalled = false;
    regMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'password without number should fail');
  }

  // Test: password strength - valid strong password
  {
    const regMiddleware = validate(registerSchema);
    const req = { body: { first_name: 'John', last_name: 'Doe', email: 'j@e.com', password: 'Strong1Pass' } };
    const res = mockRes();
    let nextCalled = false;
    regMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'strong password should pass');
  }

  // Test: sendCommand - MQTT topic injection blocked
  {
    const cmdMiddleware = validate(sendCommandSchema);
    const req = { body: { command: 'turn/on/#', payload: {} } };
    const res = mockRes();
    let nextCalled = false;
    cmdMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'MQTT topic injection should be blocked');
    assert.strictEqual(res.statusCode, 400);
  }

  // Test: sendCommand - valid command passes
  {
    const cmdMiddleware = validate(sendCommandSchema);
    const req = { body: { command: 'pump_on', payload: { speed: 100 } } };
    const res = mockRes();
    let nextCalled = false;
    cmdMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'valid command should pass');
  }

  // Test: validate params
  {
    const { cityParamSchema } = require('../src/validations/weatherValidation');
    const paramMiddleware = validate(cityParamSchema, 'params');
    const req = { params: { city: 'Bangkok' } };
    const res = mockRes();
    let nextCalled = false;
    paramMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'valid city should pass');
  }

  // Test: validate params - invalid city
  {
    const { cityParamSchema } = require('../src/validations/weatherValidation');
    const paramMiddleware = validate(cityParamSchema, 'params');
    const req = { params: { city: 'Bangkok<script>' } };
    const res = mockRes();
    let nextCalled = false;
    paramMiddleware(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, false, 'XSS in city name should be blocked');
    assert.strictEqual(res.statusCode, 400);
  }

  console.log('validateMiddleware: All tests passed.');
})();
