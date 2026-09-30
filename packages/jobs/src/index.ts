import {
  JOB_NAME_VALUES,
  type JobName,
  type JobPayload,
  JobPayloadSchema,
} from '@ysk-kit/contracts';
import type { Queue } from 'bullmq';

export type { Queue as BullmqQueue } from 'bullmq';

export type EnqueueOpts = { delayMs?: number };

export interface IJobQueue {
  enqueue<K extends JobName>(name: K, payload: JobPayload[K], opts?: EnqueueOpts): Promise<string>;
  process<K extends JobName>(name: K, handler: (payload: JobPayload[K]) => Promise<void>): void;
  close(): Promise<void>;
  bullBoardQueues?: () => Queue[];
}

const parsePayload = <K extends JobName>(name: K, payload: unknown): JobPayload[K] =>
  JobPayloadSchema[name].parse(payload) as JobPayload[K];

export const createMemoryQueue = (): IJobQueue => {
  const handlers = new Map<string, (payload: never) => Promise<void>>();
  return {
    async enqueue(name, payload) {
      const parsed = parsePayload(name, payload);
      const handler = handlers.get(name);
      if (handler) await handler(parsed as never);
      return crypto.randomUUID();
    },
    process(name, handler) {
      handlers.set(name, handler as (payload: never) => Promise<void>);
    },
    async close() {},
  };
};

export const createBullmqQueue = async (opts: {
  redisUrl: string;
  prefix?: string;
}): Promise<IJobQueue> => {
  const { Queue, Worker } = await import('bullmq');
  const { default: IORedis } = await import('ioredis');
  const connection = new IORedis(opts.redisUrl, { maxRetriesPerRequest: null });
  const prefix = opts.prefix ?? 'ysk';
  const makeQueue = (name: string) => new Queue(name, { connection, prefix });
  const queues = new Map<string, ReturnType<typeof makeQueue>>();
  const workers: Array<{ close: () => Promise<void> }> = [];
  const queueFor = (name: string) => {
    const existing = queues.get(name);
    if (existing) return existing;
    const q = makeQueue(name);
    queues.set(name, q);
    return q;
  };
  for (const name of JOB_NAME_VALUES) queueFor(name);
  return {
    async enqueue(name, payload, enqueueOpts) {
      const parsed = parsePayload(name, payload);
      const job = await queueFor(name).add(name, parsed, {
        attempts: 3,
        removeOnComplete: 100,
        ...(enqueueOpts?.delayMs ? { delay: enqueueOpts.delayMs } : {}),
      });
      return String(job.id);
    },
    process(name, handler) {
      workers.push(
        new Worker(
          name,
          async (job) => {
            const parsed = parsePayload(name, job.data);
            await handler(parsed);
          },
          { connection, prefix },
        ),
      );
    },
    async close() {
      await Promise.all(workers.map((w) => w.close()));
      await Promise.all([...queues.values()].map((q) => q.close()));
      await connection.quit();
    },
    bullBoardQueues: () => [...queues.values()],
  };
};
