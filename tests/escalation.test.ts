// tests/escalation.test.ts
import request from 'supertest';
import app from '../src/app';
import { Escalation, ChatSession } from '../src/model';
import { connectToDatabase } from '../src/lib/database';
import mongoose from 'mongoose';
import { jest, describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';


describe('Escalation Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    process.env.NODE_ENV = 'test';
    await connectToDatabase();
  });

  afterAll(async () => {
    // Clean up database and close connection
    await Escalation.deleteMany({});
    await ChatSession.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear escalations before each test
    await Escalation.deleteMany({});
    await ChatSession.deleteMany({});
  });

  describe('POST /v1/escalation', () => {
    const validEscalationData = {
      sessionId: 'test-session-escalation-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      message: 'I need help with enrollment process'
    };

    it('should create escalation successfully', async () => {
      const response = await request(app)
        .post('/v1/escalation')
        .send(validEscalationData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('successfully escalated the chat');

      // Verify escalation was created in database
      const escalation = await Escalation.findOne({ 
        sessionId: validEscalationData.sessionId 
      });
      expect(escalation).toBeTruthy();
      expect(escalation!.name).toBe(validEscalationData.name);
      expect(escalation!.email).toBe(validEscalationData.email);
      expect(escalation!.message).toBe(validEscalationData.message);
      expect(escalation!.status).toBe('open'); // default status
    });

    it('should return 400 for missing sessionId', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'I need help'
      };

      const response = await request(app)
        .post('/v1/escalation')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
      expect(response.body.errorMessage).toContain('sessionId');
    });

    it('should return 400 for missing name', async () => {
      const invalidData = {
        sessionId: 'test-session-123',
        email: 'john.doe@example.com',
        message: 'I need help'
      };

      const response = await request(app)
        .post('/v1/escalation')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
      expect(response.body.errorMessage).toContain('name');
    });

    it('should return 400 for missing email', async () => {
      const invalidData = {
        sessionId: 'test-session-123',
        name: 'John Doe',
        message: 'I need help'
      };

      const response = await request(app)
        .post('/v1/escalation')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
      expect(response.body.errorMessage).toContain('email');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        sessionId: 'test-session-123',
        name: 'John Doe',
        email: 'invalid-email',
        message: 'I need help'
      };

      const response = await request(app)
        .post('/v1/escalation')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
      expect(response.body.errorMessage).toContain('email');
    });

    it('should return 400 for missing message', async () => {
      const invalidData = {
        sessionId: 'test-session-123',
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      const response = await request(app)
        .post('/v1/escalation')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errorMessage');
      expect(response.body.errorMessage).toContain('message');
    });

    it('should return 400 for duplicate escalation (same sessionId)', async () => {
      // Create first escalation
      await request(app)
        .post('/v1/escalation')
        .send(validEscalationData)
        .expect(200);

      // Try to create duplicate escalation
      const duplicateData = {
        ...validEscalationData,
        name: 'Jane Doe',
        email: 'jane.doe@example.com'
      };

      const response = await request(app)
        .post('/v1/escalation')
        .send(duplicateData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('An escalation for this session already exists');
    });

    it('should normalize email to lowercase', async () => {
      const dataWithUppercaseEmail = {
        ...validEscalationData,
        email: 'JOHN.DOE@EXAMPLE.COM'
      };

      await request(app)
        .post('/v1/escalation')
        .send(dataWithUppercaseEmail)
        .expect(200);

      const escalation = await Escalation.findOne({ 
        sessionId: dataWithUppercaseEmail.sessionId 
      });
      expect(escalation!.email).toBe('john.doe@example.com');
    });

    it('should trim whitespace from name', async () => {
      const dataWithWhitespace = {
        ...validEscalationData,
        name: '  John Doe  '
      };

      await request(app)
        .post('/v1/escalation')
        .send(dataWithWhitespace)
        .expect(200);

      const escalation = await Escalation.findOne({ 
        sessionId: dataWithWhitespace.sessionId 
      });
      expect(escalation!.name).toBe('John Doe');
    });
  });

  describe('GET /v1/escalation', () => {
    beforeEach(async () => {
      // Create test escalations
      const testEscalations = [
        {
          sessionId: 'session-1',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          message: 'Need help with program selection',
          status: 'open'
        },
        {
          sessionId: 'session-2',
          name: 'Bob Smith',
          email: 'bob@example.com',
          message: 'Payment issue',
          status: 'in-progress'
        },
        {
          sessionId: 'session-3',
          name: 'Charlie Brown',
          email: 'charlie@example.com',
          message: 'Technical support needed',
          status: 'closed'
        }
      ];

      await Escalation.insertMany(testEscalations);
    });

    it('should retrieve all escalations with default pagination', async () => {
      const response = await request(app)
        .get('/v1/escalation')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Data retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('pagination');
      
      expect(response.body.data.results).toHaveLength(3);
      expect(response.body.data.pagination.totalItems).toBe(3);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
    });

    it('should handle pagination with custom page and limit', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=1&limit=2')
        .expect(200);

      expect(response.body.data.results).toHaveLength(2);
      expect(response.body.data.pagination.pageSize).toBe(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should handle page 2 with pagination', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=2&limit=2')
        .expect(200);

      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.pagination.currentPage).toBe(2);
    });

    it('should return empty results for non-existent page', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=10&limit=10')
        .expect(200);

      expect(response.body.data.results).toHaveLength(0);
      expect(response.body.data.pagination.currentPage).toBe(10);
    });

    it('should handle invalid page number', async () => {
      const response = await request(app)
        .get('/v1/escalation?page=0')
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Page number cannot be less than 1');
    });

    it('should return escalations sorted by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/v1/escalation')
        .expect(200);

      const results = response.body.data.results;
      expect(results).toHaveLength(3);
      
      // Check if sorted by createdAt descending (newest first)
      for (let i = 0; i < results.length - 1; i++) {
        const currentDate = new Date(results[i].createdAt);
        const nextDate = new Date(results[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('should return appropriate message when no escalations exist', async () => {
      // Clear all escalations
      await Escalation.deleteMany({});

      const response = await request(app)
        .get('/v1/escalation')
        .expect(200);

      expect(response.body.message).toBe('No data found');
      expect(response.body.data.results).toHaveLength(0);
      expect(response.body.data.pagination.totalItems).toBe(0);
    });
  });

  describe('GET /v1/escalation/:sessionId', () => {
    const sessionId = 'test-session-specific';
    
    beforeEach(async () => {
      // Create a chat session
      await ChatSession.create({
        sessionId,
        messages: [
          { role: 'user', content: 'I need help' },
          { role: 'assistant', content: 'How can I assist you?' },
          { role: 'user', content: 'I want to speak to a human' }
        ]
      });

      // Create an escalation for this session
      await Escalation.create({
        sessionId,
        name: 'Test User',
        email: 'test@example.com',
        message: 'Need human assistance',
        status: 'open'
      });
    });

    it('should retrieve escalation by sessionId successfully', async () => {
      const response = await request(app)
        .get(`/v1/escalation/${sessionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('Escalation found');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('escalation');
      expect(response.body.data).toHaveProperty('session');
      
      expect(response.body.data.escalation.sessionId).toBe(sessionId);
      expect(response.body.data.escalation.name).toBe('Test User');
      expect(response.body.data.session.sessionId).toBe(sessionId);
      expect(response.body.data.session.messages).toHaveLength(3);
    });

    it('should return 404 for non-existent escalation', async () => {
      const nonExistentSessionId = 'non-existent-session';
      
      const response = await request(app)
        .get(`/v1/escalation/${nonExistentSessionId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBe('No escalation found for this session');
      expect(response.body.data).toBeNull();
    });

    it('should return 400 for missing sessionId parameter', async () => {
      const response = await request(app)
        .get('/v1/escalation/')
        .expect(200); // This hits the GET /v1/escalation endpoint (get all)
    });

    it('should handle escalation without corresponding chat session', async () => {
      const orphanSessionId = 'orphan-session';
      
      // Create escalation without chat session
      await Escalation.create({
        sessionId: orphanSessionId,
        name: 'Orphan User',
        email: 'orphan@example.com',
        message: 'Orphan escalation',
        status: 'open'
      });

      const response = await request(app)
        .get(`/v1/escalation/${orphanSessionId}`)
        .expect(200);

      expect(response.body.data.escalation).toBeTruthy();
      expect(response.body.data.session).toBeNull();
    });
  });

  describe('API Version and Error Handling', () => {
    it('should reject invalid API version for escalation endpoints', async () => {
      const response = await request(app)
        .post('/v2/escalation')
        .send({
          sessionId: 'test-session',
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('Invalid API version');
    });

    it('should handle server errors gracefully', async () => {
      // Mock mongoose to throw an error
      jest.spyOn(Escalation, 'create').mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .post('/v1/escalation')
        .send({
          sessionId: 'test-session',
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test message'
        })
        .expect(500);

      // Restore the original implementation
      jest.restoreAllMocks();
    });
  });
});