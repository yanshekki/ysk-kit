import type { AppError } from '@ysk/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createJobService } from '../../job/application/job-service';
import { createMemoryJobRepository } from '../../job/infra/memory-job-repository';
import { createApplicationService } from '../application/application-service';
import { createMemoryApplicationRepository } from './memory-application-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const jobInput = { title: 'React engineer', department: 'Product' };

describe('application service', () => {
  it('rejects apply before publish', async () => {
    const jobs = createMemoryJobRepository();
    const job = await createJobService(jobs).create(AUTHOR, jobInput);
    const service = createApplicationService(createMemoryApplicationRepository(jobs));
    await expect(
      service.create(AUTHOR, {
        jobId: job.id,
        applicantName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
        cover: 'I use YSK Kit',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' } satisfies Partial<AppError>);
  });

  it('applies after publish and rejects a duplicate email', async () => {
    const jobs = createMemoryJobRepository();
    const jobService = createJobService(jobs);
    const job = await jobService.create(AUTHOR, jobInput);
    await jobService.publish(AUTHOR, job.id);
    const service = createApplicationService(createMemoryApplicationRepository(jobs));
    const body = {
      jobId: job.id,
      applicantName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
      cover: 'I use YSK Kit',
    };
    const created = await service.create(AUTHOR, body);
    expect(created.applicantName).toBe('Chan Tai Man');
    await expect(service.create(AUTHOR, { ...body, applicantName: 'Other' })).rejects.toMatchObject(
      {
        code: 'CONFLICT',
      } satisfies Partial<AppError>,
    );
  });

  it('rejects a missing job', async () => {
    const service = createApplicationService(
      createMemoryApplicationRepository(createMemoryJobRepository()),
    );
    await expect(
      service.create(AUTHOR, {
        jobId: '33333333-3333-4333-a333-333333333333',
        applicantName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
        cover: 'I use YSK Kit',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
  });
});

describe('application HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'apply@ysk.hk',
      password: 'password1',
      displayName: 'Apply',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns CONFLICT when applying to an unpublished job', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/job')
      .set('authorization', `Bearer ${token}`)
      .send(jobInput);
    const res = await request(app)
      .post('/v1/application')
      .set('authorization', `Bearer ${token}`)
      .send({
        jobId: created.body.data.id,
        applicantName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
        cover: 'I use YSK Kit',
      });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });

  it('applies after publish and rejects a missing job', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/job')
      .set('authorization', `Bearer ${token}`)
      .send(jobInput);
    await request(app)
      .post(`/v1/job/${created.body.data.id}/publish`)
      .set('authorization', `Bearer ${token}`)
      .send({});
    const ok = await request(app)
      .post('/v1/application')
      .set('authorization', `Bearer ${token}`)
      .send({
        jobId: created.body.data.id,
        applicantName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
        cover: 'I use YSK Kit',
      });
    expect(ok.status).toBe(201);
    const missing = await request(app)
      .post('/v1/application')
      .set('authorization', `Bearer ${token}`)
      .send({
        jobId: '33333333-3333-4333-a333-333333333333',
        applicantName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
        cover: 'I use YSK Kit',
      });
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/application').send({
      jobId: '33333333-3333-4333-a333-333333333333',
      applicantName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
      cover: 'I use YSK Kit',
    });
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });
});
