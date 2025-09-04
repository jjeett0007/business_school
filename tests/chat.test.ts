
import request from 'supertest';
import app from '../src/app';
import { ChatSession } from '../src/model';
import { connectToDatabase } from '../src/lib/database';
import mongoose from 'mongoose';
import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';

// Mock the OpenAI service to avoid real API calls
jest.mock('openai');
jest.mock('../src/socket/websocket', () => ({
  sendMessageBySessionId: jest.fn(),
  isTyping: jest.fn(),
}));

describe('Chat Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    process.env.NODE_ENV = 'test';
    await connectToDatabase();
  });

  afterAll(async () => {
    // Clean up database and close connection
    await ChatSession.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear chat sessions before each test
    await ChatSession.deleteMany({});
  });

  describe('POST /v1/chat', () => {
    const validChatData = {
      sessionId: 'test-session-123',
      content: 'Hello, I need help with business analysis programs'
    };

    it('should create a new chat message successfully', async () => {
      const response = await request(app)
        .post('/v1/chat')
        .send(validChatData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Chat processed successfully');
    });

    it('should return 400 for missing sessionId', async () => {
      const invalidData = {
        content: 'Hello, I need help'
      };

      const response = await request(app)
        .post('/v1/chat')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
      expect(response.body.errorMessage).toContain('sessionId');
    });

    it('should return 400 for missing content', async () => {
      const invalidData = {
        sessionId: 'test-session-123'
      };

      const response = await request(app)
        .post('/v1/chat')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
      expect(response.body.errorMessage).toContain('content');
    });

    it('should return 400 for empty content', async () => {
      const invalidData = {
        sessionId: 'test-session-123',
        content: ''
      };

      const response = await request(app)
        .post('/v1/chat')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
    });

    it('should return 400 for invalid sessionId type', async () => {
      const invalidData = {
        sessionId: 12345,
        content: 'Hello, I need help'
      };

      const response = await request(app)
        .post('/v1/chat')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
    });

    it('should handle long content messages', async () => {
      const longContent = 'A'.repeat(5000); // 5000 character message
      const longChatData = {
        sessionId: 'test-session-long',
        content: longContent
      };

      const response = await request(app)
        .post('/v1/chat')
        .send(longChatData)
        .expect(200);

      expect(response.body.message).toBe('Chat processed successfully');
    });
  });

  describe('GET /v1/chat/:sessionId', () => {
    const sessionId = 'test-session-get-123';

    beforeEach(async () => {
      // Create a chat session for testing
      await ChatSession.create({
        sessionId,
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there! How can I help you?' }
        ]
      });
    });

    it('should retrieve chat session successfully', async () => {
      const response = await request(app)
        .get(`/v1/chat/${sessionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Chat session found');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('sessionId', sessionId);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data.messages).toHaveLength(2);
    });

    it('should return 404 for non-existent session', async () => {
      const nonExistentSessionId = 'non-existent-session';
      
      const response = await request(app)
        .get(`/v1/chat/${nonExistentSessionId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Chat session not found');
      expect(response.body.data).toBeNull();
    });

    it('should return 400 for missing sessionId parameter', async () => {
      const response = await request(app)
        .get('/v1/chat/')
        .expect(404); // Express returns 404 for missing route parameter
    });

    it('should handle special characters in sessionId', async () => {
      const specialSessionId = 'session-with-special-chars-!@#$%';
      
      await ChatSession.create({
        sessionId: specialSessionId,
        messages: [{ role: 'user', content: 'Test message' }]
      });

      const response = await request(app)
        .get(`/v1/chat/${encodeURIComponent(specialSessionId)}`)
        .expect(200);

      expect(response.body.data.sessionId).toBe(specialSessionId);
    });

    it('should return empty messages array for session with no messages', async () => {
      const emptySessionId = 'empty-session';
      
      await ChatSession.create({
        sessionId: emptySessionId,
        messages: []
      });

      const response = await request(app)
        .get(`/v1/chat/${emptySessionId}`)
        .expect(200);

      expect(response.body.data.messages).toHaveLength(0);
    });
  });

  describe('API Version Validation', () => {
    it('should reject invalid API version', async () => {
      const response = await request(app)
        .post('/v2/chat')
        .send({
          sessionId: 'test-session',
          content: 'Hello'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid API version');
    });

    it('should accept valid API version v1', async () => {
      const response = await request(app)
        .post('/v1/chat')
        .send({
          sessionId: 'test-session',
          content: 'Hello'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('CORS and Headers', () => {
    it('should handle CORS preflight request', async () => {
      const response = await request(app)
        .options('/v1/chat')
        .expect(200);

      // Check if CORS headers are present
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle large request payloads', async () => {
      const largeContent = 'A'.repeat(1000000); // 1MB content
      
      const response = await request(app)
        .post('/v1/chat')
        .send({
          sessionId: 'large-payload-session',
          content: largeContent
        });

      // Should handle large payloads without error (up to 50MB limit)
      expect(response.status).toBe(200);
    });
  });
});