/**
 * Job queue scaffold using BullMQ and Redis.
 * Set REDIS_URL to enable; otherwise queue operations no-op.
 * Install: npm install bullmq ioredis (optional; only needed when using queues).
 * Use for: AI jobs, email, heavy exports, to avoid blocking the request.
 */
const REDIS_URL = process.env.REDIS_URL?.trim();

let queue = null;
let worker = null;

export async function getQueue() {
  if (!REDIS_URL) return null;
  if (queue) return queue;
  try {
    const { Queue } = await import('bullmq');
    const Redis = (await import('ioredis')).default;
    const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: 1 });
    queue = new Queue('unipilot-jobs', { connection });
    return queue;
  } catch (e) {
    console.warn('BullMQ queue init failed:', e?.message);
    return null;
  }
}

/**
 * Add a job to the queue (e.g. ai.summarize, email.welcome).
 * Returns job id if queued, null if Redis unavailable.
 */
export async function addJob(name, data, opts = {}) {
  const q = await getQueue();
  if (!q) return null;
  const job = await q.add(name, data, { removeOnComplete: 100, ...opts });
  return job?.id ?? null;
}

/**
 * Create a worker that processes jobs. Call once at startup if you want background processing.
 * Example: processJob('ai.summarize', async (data) => { ... }).
 */
export async function createWorker(handlers) {
  if (!REDIS_URL || worker) return worker;
  try {
    const { Worker } = await import('bullmq');
    const Redis = (await import('ioredis')).default;
    const connection = new Redis(REDIS_URL, { maxRetriesPerRequest: null });
    worker = new Worker(
      'unipilot-jobs',
      async (job) => {
        const fn = handlers[job.name];
        if (fn) return await fn(job.data);
        console.warn('No handler for job:', job.name);
      },
      { connection }
    );
    worker.on('failed', (job, err) => console.error('Job failed', job?.name, err?.message));
    return worker;
  } catch (e) {
    console.warn('BullMQ worker init failed:', e?.message);
    return null;
  }
}

export function isQueueEnabled() {
  return !!REDIS_URL;
}
