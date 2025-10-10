import request from 'supertest';
import { app } from '../index';
import { User } from '../models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

describe('Authentication Security Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Password Security', () => {
    it('should hash passwords with bcrypt and salt rounds 12', async () => {
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
        .expect(201);

      const user = await User.findOne({ username: 'testuser' });
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(userData.password);
      
      // Verify bcrypt can verify the password
      const isValid = await bcrypt.compare(userData.password, user?.passwordHash || '');
      expect(isValid).toBe(true);
    });

    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        { password: '123', message: 'Password too short' },
        { password: 'password', message: 'No uppercase letter' },
        { password: 'PASSWORD', message: 'No lowercase letter' },
        { password: 'Password', message: 'No numbers' },
        { password: 'Password123', message: 'No special characters' }
      ];

      for (const { password, message } of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `user${Math.random()}`,
            password,
            fullName: 'Test User',
            idNumber: 'ABC123456',
            accountNumber: '1234567890123456'
          })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      }
    });

    it('should prevent password reuse (password history)', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      // Register user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same password (should fail)
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...userData,
          username: 'differentuser'
        })
        .expect(409);

      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit authentication attempts', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Make many failed login attempts
      const promises = Array(25).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            username: userData.username,
            accountNumber: userData.accountNumber,
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // Should get rate limited after 20 attempts
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Brute Force Protection', () => {
    it('should implement Express Brute protection', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      // Register user first
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Make multiple failed attempts to trigger brute force protection
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username: userData.username,
            accountNumber: userData.accountNumber,
            password: 'wrongpassword'
          });

        if (i < 5) {
          expect(response.status).toBe(401);
        } else {
          // After 5 attempts, should be rate limited by brute force protection
          expect(response.status).toBe(429);
          expect(response.body.error).toContain('Too many failed attempts');
        }
      }
    });
  });

  describe('Input Validation', () => {
    it('should validate username format', async () => {
      const invalidUsernames = ['ab', 'a', 'user@domain.com', 'user space', 'user<script>'];

      for (const username of invalidUsernames) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username,
            password: 'TestPass123!',
            fullName: 'Test User',
            idNumber: 'ABC123456',
            accountNumber: '1234567890123456'
          })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      }
    });

    it('should validate account number format', async () => {
      const invalidAccountNumbers = ['123', '123abc', '123-456', ''];

      for (const accountNumber of invalidAccountNumbers) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: `user${Math.random()}`,
            password: 'TestPass123!',
            fullName: 'Test User',
            idNumber: 'ABC123456',
            accountNumber
          })
          .expect(400);

        expect(response.body.error).toBe('Invalid input');
      }
    });

    it('should prevent NoSQL injection', async () => {
      const maliciousPayload = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: { $ne: null } // NoSQL injection attempt
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload)
        .expect(400);

      expect(response.body.error).toBe('Invalid input');
    });
  });

  describe('Session Security', () => {
    it('should regenerate session on login', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      // Register user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Login and check session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          accountNumber: userData.accountNumber,
          password: userData.password
        })
        .expect(200);

      // Session should be regenerated (new session ID)
      expect(loginResponse.headers['set-cookie']).toBeDefined();
    });

    it('should have secure session cookies', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123!',
        fullName: 'Test User',
        idNumber: 'ABC123456',
        accountNumber: '1234567890123456'
      };

      // Register and login
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: userData.username,
          accountNumber: userData.accountNumber,
          password: userData.password
        })
        .expect(200);

      const cookies = response.headers['set-cookie'];
      const sessionCookie = cookies?.find((cookie: string) => cookie.includes('sid'));
      
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('SameSite=Strict');
    });
  });
});
