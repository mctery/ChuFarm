/**
 * One-time migration script: converts any sensor data `value` fields
 * stored as strings to numbers.
 *
 * Usage: node src/scripts/migrateSensorValues.js
 *
 * Safe to run multiple times — only updates documents where value is a string.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUrl } = require('../config');

async function migrate() {
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('sensordatas');

  // Find documents where value is stored as a string
  const cursor = collection.find({ value: { $type: 'string' } });
  const total = await collection.countDocuments({ value: { $type: 'string' } });

  console.log(`Found ${total} documents with string values`);

  if (total === 0) {
    console.log('Nothing to migrate');
    await mongoose.disconnect();
    return;
  }

  let updated = 0;
  let failed = 0;

  for await (const doc of cursor) {
    const numeric = Number(doc.value);
    if (isNaN(numeric)) {
      console.warn(`Skipping _id=${doc._id}: value="${doc.value}" is not a valid number`);
      failed++;
      continue;
    }

    await collection.updateOne({ _id: doc._id }, { $set: { value: numeric } });
    updated++;

    if (updated % 1000 === 0) {
      console.log(`Progress: ${updated}/${total}`);
    }
  }

  console.log(`Migration complete: ${updated} updated, ${failed} skipped`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
