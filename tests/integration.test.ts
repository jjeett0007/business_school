
import request from 'supertest';
import app from '../src/app';
import { ChatSession, Escalation } from '../src/model';
import { connectToDatabase } from '../src/lib/database';
import mongoose from 'mongoose';
import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';


describe('Integration Tests - Complete User Flows', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectToDatabase();
  });

  afterAll(async () => {
    await ChatSession.deleteMany({});
    await Escalation.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await ChatSession.deleteMany({});
    await Escalation.deleteMany({});
  });

  describe('Complete Chat to Escalation Flow', () => {
    const sessionId = 'integration-test-session-123';

    it('should handle complete user journey from chat to escalation', async () => {
      // Step 1: Start a chat conversation
      const chatResponse = await request(app)
        .post('/v1/chat')
        .send({
          sessionId,
          content: 'Hello, I need information about your programs'
        })
        .expect(200);

      expect(chatResponse.body.message).toBe('Chat processed successfully');

      // Step 2: Retrieve chat history
      const historyResponse = await request(app)
        .get(`/v1/chat/${sessionId}`)
        .expect(200);

      expect(historyResponse.body.data.sessionId).toBe(sessionId);
      expect(historyResponse.body.data.messages).toHaveLength(1); // Only user message stored initially
      expect(historyResponse.body.data.messages[0]).toMatchObject({
        role: 'user',
        content: 'Hello, I need information about your programs'
      });

      // Step 3: Continue chat conversation
      await request(app)
        .post('/v1/chat')
        .send({
          sessionId,
          content: 'I want to speak to a human representative'
        })
        .expect(200);

      // Step 4: Create escalation
      const escalationResponse = await request(app)
        .post('/v1/escalation')
        .send({
          sessionId,
          name: 'John Integration Test',
          email: 'john.integration@example.com',
          message: 'I need human assistance with program selection'
        })
        .expect(200);

      expect(escalationResponse.body.message).toBe('successfully escalated the chat');

      // Step 5: Retrieve escalation with chat history
      const escalationHistoryResponse = await request(app)
        .get(`/v1/escalation/${sessionId}`)
        .expect(200);

      expect(escalationHistoryResponse.body.data.escalation).toBeTruthy();
      expect(escalationHistoryResponse.body.data.session).toBeTruthy();
      expect(escalationHistoryResponse.body.data.escalation.name).toBe('John Integration Test');
      expect(escalationHistoryResponse.body.data.session.messages.length).toBeGreaterThan(0);

      // Step 6: Verify escalation appears in all escalations list
      const allEscalationsResponse = await request(app)
        .get('/v1/escalation')
        .expect(200);

      expect(allEscalationsResponse.body.data.results).toHaveLength(1);
      expect(allEscalationsResponse.body.data.results[0].sessionId).toBe(sessionId);
    });

    it('should prevent duplicate escalations for same session', async () => {
      // Create initial chat
      await request(app)
        .post('/v1/chat')
        .send({
          sessionId,
          content: 'I need help'
        })
        .expect(200);

      // Create first escalation
      await request(app)
        .post('/v1/escalation')
        .send({
          sessionId,
          name: 'First User',
          email: 'first@example.com',
          message: 'First escalation request'
        })
        .expect(200);

      // Attempt to create duplicate escalation
      const duplicateResponse = await request(app)
        .post('/v1/escalation')
        .send({
          sessionId,
          name: 'Second User',
          email: 'second@example.com',
          message: 'Second escalation request'
        })
        .expect(400);

      expect(duplicateResponse.body.message).toBe('An escalation for this session already exists');

      // Verify only one escalation exists
      const escalationsResponse = await request(app)
        .get('/v1/escalation')
        .expect(200);

      expect(escalationsResponse.body.data.results).toHaveLength(1);
      expect(escalationsResponse.body.data.results[0].name).toBe('First User');
    });
  });

  describe('Multiple Sessions Management', () => {
    it('should handle multiple independent chat sessions', async () => {
      const session1 = 'multi-session-1';
      const session2 = 'multi-session-2';
      const session3 = 'multi-session-3';

      // Create multiple chat sessions
      await Promise.all([
        request(app).post('/v1/chat').send({
          sessionId: session1,
          content: 'Hello from session 1'
        }),
        request(app).post('/v1/chat').send({
          sessionId: session2,
          content: 'Hello from session 2'
        }),
        request(app).post('/v1/chat').send({
          sessionId: session3,
          content: 'Hello from session 3'
        })
      ]);

      // Verify each session is independent
      const [hist1, hist2, hist3] = await Promise.all([
        request(app).get(`/v1/chat/${session1}`).expect(200),
        request(app).get(`/v1/chat/${session2}`).expect(200),
        request(app).get(`/v1/chat/${session3}`).expect(200)
      ]);

      expect(hist1.body.data.sessionId).toBe(session1);
      expect(hist2.body.data.sessionId).toBe(session2);
      expect(hist3.body.data.sessionId).toBe(session3);

      // Create escalations for different sessions
      await Promise.all([
        request(app).post('/v1/escalation').send({
          sessionId: session1,
          name: 'User 1',
          email: 'user1@example.com',
          message: 'Escalation 1'
        }),
        request(app).post('/v1/escalation').send({
          sessionId: session3,
          name: 'User 3',
          email: 'user3@example.com',
          message: 'Escalation 3'
        })
      ]);

      // Verify escalations
      const allEscalations = await request(app)
        .get('/v1/escalation')
        .expect(200);

      expect(allEscalations.body.data.results).toHaveLength(2);
      
      const escalation1 = await request(app)
        .get(`/v1/escalation/${session1}`)
        .expect(200);
      
      const escalation2 = await request(app)
        .get(`/v1/escalation/${session2}`)
        .expect(404); // No escalation for session2
      
      const escalation3 = await request(app)
        .get(`/v1/escalation/${session3}`)
        .expect(200);

      expect(escalation1.body.data.escalation.name).toBe('User 1');
      expect(escalation3.body.data.escalation.name).toBe('User 3');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/v1/chat')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should handle extremely large session IDs', async () => {
      const largeSessionId = 'a'.repeat(1000);
      
      const response = await request(app)
        .post('/v1/chat')
        .send({
          sessionId: largeSessionId,
          content: 'Test with large session ID'
        })
        .expect(200);

      const historyResponse = await request(app)
        .get(`/v1/chat/${encodeURIComponent(largeSessionId)}`)
        .expect(200);

      expect(historyResponse.body.data.sessionId).toBe(largeSessionId);
    });

    it('should handle special characters in user input', async () => {
      const specialContent = '!@#$%^&*()_+{}|:"<>?[]\\;\',./ 你好 🚀 émojis';
      
      await request(app)
        .post('/v1/chat')
        .send({
          sessionId: 'special-chars-session',
          content: specialContent
        })
        .expect(200);

      const historyResponse = await request(app)
        .get('/v1/chat/special-chars-session')
        .expect(200);

      expect(historyResponse.body.data.messages[0].content).toBe(specialContent);
    });

    it('should handle concurrent requests to same session', async () => {
      const sessionId = 'concurrent-session';
      const promises = [];

      // Send 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/v1/chat')
            .send({
              sessionId,
              content: `Message ${i + 1}`
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify all messages were stored
      const historyResponse = await request(app)
        .get(`/v1/chat/${sessionId}`)
        .expect(200);

      expect(historyResponse.body.data.messages).toHaveLength(5);
    });
  });

  describe('Pagination Edge Cases', () => {
    beforeEach(async () => {
      // Create 25 test escalations
      const escalations = [];
      for (let i = 1; i <= 25; i++) {
        escalations.push({
          sessionId: `session-${i.toString().padStart(2, '0')}`,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          message: `Test message ${i}`,
          status: i <= 10 ? 'open' : i <= 20 ? 'in-progress' : 'closed'
        });
      }
      await Escalation.insertMany(escalations);
    });

    it('should handle first page correctly', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=1&limit=10')
        .expect(200);

      expect(response.body.data.results).toHaveLength(10);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBe(3);
      expect(response.body.data.pagination.totalItems).toBe(25);
    });

    it('should handle middle page correctly', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=2&limit=10')
        .expect(200);

      expect(response.body.data.results).toHaveLength(10);
      expect(response.body.data.pagination.currentPage).toBe(2);
    });

    it('should handle last page correctly', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=3&limit=10')
        .expect(200);

      expect(response.body.data.results).toHaveLength(5);
      expect(response.body.data.pagination.currentPage).toBe(3);
    });

    it('should handle page beyond available data', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=10&limit=10')
        .expect(200);

      expect(response.body.data.results).toHaveLength(0);
      expect(response.body.message).toBe('No data found');
    });

    it('should handle very large limit', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=1&limit=1000')
        .expect(200);

      expect(response.body.data.results).toHaveLength(25);
      expect(response.body.data.pagination.totalPages).toBe(1);
    });
  });

  describe('API Versioning', () => {
    it('should consistently reject all invalid API versions', async () => {
      const invalidVersions = ['v0', 'v2', 'v3', 'beta', 'alpha'];
      
      for (const version of invalidVersions) {
        const chatResponse = await request(app)
          .post(`/${version}/chat`)
          .send({
            sessionId: 'test-session',
            content: 'test message'
          })
          .expect(401);

        expect(chatResponse.body.success).toBe(false);
        expect(chatResponse.body.error).toContain('Invalid API version');

        const escalationResponse = await request(app)
          .post(`/${version}/escalation`)
          .send({
            sessionId: 'test-session',
            name: 'Test User',
            email: 'test@example.com',
            message: 'test message'
          })
          .expect(401);

        expect(escalationResponse.body.success).toBe(false);
      }
    });

    it('should accept v1 API version for all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/v1/chat', body: { sessionId: 'test', content: 'test' } },
        { method: 'post', path: '/v1/escalation', body: { sessionId: 'test', name: 'Test', email: 'test@example.com', message: 'test' } },
        { method: 'get', path: '/v1/escalation', body: {} }
      ];

      for (const endpoint of endpoints) {
        const method = endpoint.method.toLowerCase();
        const req = method === 'get' ? request(app).get(endpoint.path) : request(app).post(endpoint.path);
        const response = await req.send(endpoint.body);

        expect(response.status).not.toBe(401); // Should not be unauthorized
      }
    });
  });
});