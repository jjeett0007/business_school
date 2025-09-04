// tests/setup.ts
/// <reference types="jest" />

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import catchAsync from '../src/utils/catchAsync';
import { connectToDatabase } from '../src/lib/database';

// ✅ Load all environment variables (OpenAI, Cloudinary, SMTP, etc.)
dotenv.config({ path: '.env' });

// ✅ Force NODE_ENV to test so your code can behave accordingly
process.env.NODE_ENV = 'test';

// ✅ Extend global type to include catchAsync
declare global {
  // eslint-disable-next-line no-var
  var catchAsync: typeof catchAsync;
}

// ✅ Make catchAsync available globally for tests
global.catchAsync = catchAsync;

// ✅ Increase Jest timeout (GPT + DB ops can take longer)
jest.setTimeout(30000);

let mongoServer: MongoMemoryServer;

// 🔹 Before all tests: start an in-memory MongoDB and connect
beforeAll(async () => {

  // Use your real DB connection logic
  await connectToDatabase();
});

// 🔹 After each test: clean all collections
afterEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// 🔹 After all tests: disconnect and stop the in-memory DB
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
