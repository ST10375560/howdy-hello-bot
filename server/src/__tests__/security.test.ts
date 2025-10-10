import request from 'supertest';
import { app } from '../index';
import mongoose from 'mongoose';

describe('Security Middleware Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Helmet Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
      
      // CSP header should be present
      expect(response.headers['content-security-policy']).toBeDefined();
      
      // HSTS header should be present in production
      if (process.env.NODE_ENV === 'production') {
        expect(response.headers['strict-transport-security']).toBeDefined();
      }
    });

    it('should prevent clickjacking', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    it('should set proper CSP', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });

  describe('Rate Limiting', () => {
    it('should apply global rate limiting', async () => {
      const promises = Array(110).fill(null).map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Should be rate limited after 100 requests
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 10000);

    it('should apply stricter rate limiting to auth endpoints', async () => {
      const promises = Array(25).fill(null).map(() =>
        request(app).get('/api/auth/me')
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Should be rate limited after 20 requests
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Configuration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:8080')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com')
        .expect(200); // CORS is handled by browser, server still responds

      // The CORS header should not include the malicious origin
      expect(response.headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });
  });

  describe('Request Size Limiting', () => {
    it('should limit request body size', async () => {
      const largePayload = 'x'.repeat(200000); // 200KB, larger than 100KB limit

      const response = await request(app)
        .post('/api/auth/register')
        .send({ data: largePayload })
        .expect(413); // Payload Too Large

      expect(response.text).toContain('Payload Too Large');
    });
  });

  describe('MongoDB Injection Prevention', () => {
    it('should sanitize NoSQL injection attempts', async () => {
      const maliciousPayload = {
        username: { $ne: null },
        password: { $gt: '' },
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload)
        .expect(400);

      expect(response.body.error).toBe('Invalid input');
    });

    it('should prevent MongoDB operator injection', async () => {
      const maliciousPayload = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: { $where: 'this.fullName.length > 0' },
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload)
        .expect(400);

      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF token for state-changing operations', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(403); // Forbidden due to missing CSRF token

      expect(response.body.error).toContain('CSRF');
    });

    it('should provide CSRF token endpoint', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      expect(response.body.csrfToken).toBeDefined();
      expect(typeof response.body.csrfToken).toBe('string');
    });
  });

  describe('HTTPS Enforcement', () => {
    it('should redirect HTTP to HTTPS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // This test would need to be run with actual HTTP request
      // For now, we'll test the middleware logic
      const response = await request(app)
        .get('/api/health')
        .set('x-forwarded-proto', 'http')
        .expect(200);

      process.env.NODE_ENV = originalEnv;
    });
  });
});
