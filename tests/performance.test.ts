// tests/performance.test.ts
import request from 'supertest';
import app from '../src/app';
import { ChatSession, Escalation } from '../src/model';
import { connectToDatabase } from '../src/lib/database';
import mongoose from 'mongoose';
import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';


describe('Performance and Load Tests', () => {
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

  describe('Response Time Tests', () => {
    it('should respond to chat creation within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/v1/chat')
        .send({
          sessionId: 'performance-test-session',
          content: 'Performance test message'
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    it('should respond to chat history retrieval quickly', async () => {
      const sessionId = 'quick-response-session';
      
      // Create a chat session first
      await ChatSession.create({
        sessionId,
        messages: [
          { role: 'user', content: 'Test message' },
          { role: 'assistant', content: 'Test response' }
        ]
      });

      const startTime = Date.now();
      
      await request(app)
        .get(`/v1/chat/${sessionId}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle escalation creation quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/v1/escalation')
        .send({
          sessionId: 'quick-escalation-session',
          name: 'Quick Test User',
          email: 'quick@example.com',
          message: 'Quick escalation test'
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous chat requests', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .post('/v1/chat')
            .send({
              sessionId: `concurrent-session-${i}`,
              content: `Concurrent message ${i}`
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle all concurrent requests within reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 10 concurrent requests
    });

    it('should handle concurrent escalation requests', async () => {
      const concurrentRequests = 5;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(app)
            .post('/v1/escalation')
            .send({
              sessionId: `concurrent-escalation-${i}`,
              name: `Concurrent User ${i}`,
              email: `concurrent${i}@example.com`,
              message: `Concurrent escalation ${i}`
            })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify all escalations were created
      const allEscalations = await request(app)
        .get('/v1/escalation')
        .expect(200);

      expect(allEscalations.body.data.results).toHaveLength(concurrentRequests);
    });

    it('should handle mixed concurrent requests (chat + escalation)', async () => {
      const promises = [];

      // Mix of chat and escalation requests
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/v1/chat')
            .send({
              sessionId: `mixed-chat-${i}`,
              content: `Mixed chat message ${i}`
            })
        );

        promises.push(
          request(app)
            .post('/v1/escalation')
            .send({
              sessionId: `mixed-escalation-${i}`,
              name: `Mixed User ${i}`,
              email: `mixed${i}@example.com`,
              message: `Mixed escalation ${i}`
            })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Large Data Handling', () => {
    it('should handle large chat messages efficiently', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB message
      
      const startTime = Date.now();
      
      await request(app)
        .post('/v1/chat')
        .send({
          sessionId: 'large-content-session',
          content: largeContent
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(5000);

      // Verify the large content was stored correctly
      const historyResponse = await request(app)
        .get('/v1/chat/large-content-session')
        .expect(200);

      expect(historyResponse.body.data.messages[0].content).toBe(largeContent);
    });

    it('should handle sessions with many messages', async () => {
      const sessionId = 'many-messages-session';
      const messageCount = 50;

      // Create session with many messages
      const messages = [];
      for (let i = 0; i < messageCount; i++) {
        messages.push({ role: i % 2 === 0 ? 'user' : 'assistant', content: `Message ${i + 1}` });
      }

      await ChatSession.create({
        sessionId,
        messages
      });

      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/v1/chat/${sessionId}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000);
      expect(response.body.data.messages).toHaveLength(messageCount);
    });

    it('should efficiently paginate through large datasets', async () => {
      // Create large number of escalations
      const escalationCount = 100;
      const escalations = [];

      for (let i = 1; i <= escalationCount; i++) {
        escalations.push({
          sessionId: `bulk-session-${i.toString().padStart(3, '0')}`,
          name: `Bulk User ${i}`,
          email: `bulk${i}@example.com`,
          message: `Bulk message ${i}`,
          status: 'open'
        });
      }

      await Escalation.insertMany(escalations);

      // Test different page sizes
      const pageSizes = [10, 25, 50];
      
      for (const pageSize of pageSizes) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get(`/v1/escalation?page=1&limit=${pageSize}`)
          .expect(200);

        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(3000);
        expect(response.body.data.results).toHaveLength(pageSize);
        expect(response.body.data.pagination.totalItems).toBe(escalationCount);
      }
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory with repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many requests
      for (let i = 0; i < 20; i++) {
        await request(app)
          .post('/v1/chat')
          .send({
            sessionId: `memory-test-${i}`,
            content: `Memory test message ${i}`
          })
          .expect(200);

        await request(app)
          .get(`/v1/chat/memory-test-${i}`)
          .expect(200);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Performance', () => {
    it('should efficiently query chat sessions', async () => {
      // Create multiple sessions
      const sessionCount = 20;
      const sessions = [];

      for (let i = 1; i <= sessionCount; i++) {
        sessions.push({
          sessionId: `db-perf-session-${i}`,
          messages: [
            { role: 'user', content: `Test message ${i}` },
            { role: 'assistant', content: `Response ${i}` }
          ]
        });
      }

      await ChatSession.insertMany(sessions);

      // Test querying multiple sessions
      const promises = [];
      for (let i = 1; i <= sessionCount; i++) {
        promises.push(
          request(app).get(`/v1/chat/db-perf-session-${i}`)
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should efficiently create and query escalations in bulk', async () => {
      const bulkSize = 25;
      const promises = [];

      // Create escalations concurrently
      for (let i = 1; i <= bulkSize; i++) {
        promises.push(
          request(app)
            .post('/v1/escalation')
            .send({
              sessionId: `bulk-escalation-${i}`,
              name: `Bulk User ${i}`,
              email: `bulk${i}@example.com`,
              message: `Bulk escalation ${i}`
            })
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const creationTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Query all escalations
      const queryStart = Date.now();
      const allEscalations = await request(app)
        .get('/v1/escalation')
        .expect(200);
      const queryTime = Date.now() - queryStart;

      expect(allEscalations.body.data.results).toHaveLength(bulkSize);
      expect(creationTime).toBeLessThan(10000); // Bulk creation within 10 seconds
      expect(queryTime).toBeLessThan(2000); // Query within 2 seconds
    });
  });
});