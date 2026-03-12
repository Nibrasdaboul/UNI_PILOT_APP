/**
 * Attach a unique request ID to each request for tracing and logs.
 */
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
