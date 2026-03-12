import jwt from 'jsonwebtoken';
import { db } from '../db.js';

// Production: JWT_SECRET is required (no fallback). Prevents weak default secrets.
const JWT_SECRET = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error(
    'JWT_SECRET must be set in production and at least 32 characters. Set it in .env or Render Environment.'
  );
}
const SECRET = JWT_SECRET || 'unipilot-dev-secret-change-in-production';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid authorization' });
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, SECRET);
    const user = await db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(payload.userId);
    if (!user) return res.status(401).json({ detail: 'User not found' });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ detail: 'Admin only' });
  }
  next();
}

export function signToken(userId) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '7d' });
}
