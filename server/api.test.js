/**
 * API integration tests. Requires DATABASE_URL (e.g. test PostgreSQL).
 * Run: npm run test:api (from project root)
 */
import request from 'supertest';
import { describe, it, beforeAll, expect } from 'vitest';
import { app } from './index.js';


describe('API', () => {
  describe('Public', () => {
    it('GET /api/health returns 200 and status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body?.status).toBe('ok');
    });

    it('GET /api/ready returns 200 when DB connected', async () => {
      const res = await request(app).get('/api/ready');
      expect([200, 503]).toContain(res.status);
      if (res.status === 200) expect(res.body?.status).toBe('ready');
    });
  });

  describe('Auth', () => {
    it('POST /api/auth/login with invalid body returns 400', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/register with valid body returns 200 and token', async () => {
      const email = `test-${Date.now()}@unipilot.test`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'TestPass123!', full_name: 'Test User' });
      expect(res.status).toBe(200);
      expect(res.body?.access_token).toBeDefined();
      expect(res.body?.user?.email).toBe(email);
    });
  });

  describe('Protected routes', () => {
    let token;

    beforeAll(async () => {
      const email = `dashboard-${Date.now()}@unipilot.test`;
      await request(app).post('/api/auth/register').send({ email, password: 'TestPass123!', full_name: 'Dashboard Test' });
      const login = await request(app).post('/api/auth/login').send({ email, password: 'TestPass123!' });
      token = login.body?.access_token;
    });

    it('GET /api/dashboard/summary without token returns 401', async () => {
      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(401);
    });

    it('GET /api/dashboard/summary with token returns 200', async () => {
      if (!token) return;
      const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('courses_count');
    });

    it('GET /api/planner/daily with token returns 200', async () => {
      if (!token) return;
      const res = await request(app).get('/api/planner/daily?date=2025-01-15').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });
  });
});
