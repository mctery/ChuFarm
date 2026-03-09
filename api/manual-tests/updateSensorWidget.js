const assert = require('assert');

async function runTest() {
  const fakeModel = {
    findOneAndUpdate: async (query, update, options) => {
      return { device_id: query.device_id, ...update };
    }
  };

  const req = { params: { device_id: 'device123' }, body: { foo: 'bar' } };
  const res = {
    statusCode: 0,
    data: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.data = payload; }
  };

  async function updateSensorWidget(req, res) {
    try {
      const { device_id } = req.params;
      const result = await fakeModel.findOneAndUpdate(
        { device_id },
        { widget_json: JSON.stringify(req.body) },
        { new: true }
      );
      if (!result) {
        res.status(404);
        throw new Error(`cannot find ID ${device_id}`);
      }
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  await updateSensorWidget(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.data, {
    device_id: 'device123',
    widget_json: JSON.stringify(req.body)
  });
  console.log('manual check passed');
}

runTest();
