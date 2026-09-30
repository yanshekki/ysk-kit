import type { AppError } from '@ysk-kit/domain-kernel';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createMemoryInput } from '../../../create-memory-input';
import { createEnrollmentService } from '../../enrollment/application/enrollment-service';
import { createMemoryEnrollmentRepository } from '../../enrollment/infra/memory-enrollment-repository';
import { createCourseService } from '../application/course-service';
import { createMemoryCourseRepository } from './memory-course-repository';

const AUTHOR = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const validCourse = {
  title: 'Cantonese A1',
  quota: 8,
  startsOn: '2035-03-01',
};

describe('course service', () => {
  it('creates and lists rows for the author only', async () => {
    const service = createCourseService(createMemoryCourseRepository());
    const created = await service.create(AUTHOR, validCourse);
    expect(created.title).toBe('Cantonese A1');
    expect(created.quota).toBe(8);
    expect(created.startsOn).toBe('2035-03-01');
    expect((await service.list(AUTHOR, { limit: 20 })).items).toHaveLength(1);
    expect((await service.list(OTHER, { limit: 20 })).items).toHaveLength(0);
  });
});

describe('enrollment service', () => {
  it('enrols a student on an owned course', async () => {
    const courses = createMemoryCourseRepository();
    const course = await createCourseService(courses).create(AUTHOR, validCourse);
    const service = createEnrollmentService(createMemoryEnrollmentRepository(courses));
    const row = await service.create(AUTHOR, {
      courseId: course.id,
      studentName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    });
    expect(row.email).toBe('chan@ysk.hk');
    expect(row.studentName).toBe('Chan Tai Man');
  });

  it('rejects a missing or foreign course', async () => {
    const courses = createMemoryCourseRepository();
    const course = await createCourseService(courses).create(AUTHOR, validCourse);
    const service = createEnrollmentService(createMemoryEnrollmentRepository(courses));
    await expect(
      service.create(AUTHOR, {
        courseId: '33333333-3333-4333-a333-333333333333',
        studentName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
    await expect(
      service.create(OTHER, {
        courseId: course.id,
        studentName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' } satisfies Partial<AppError>);
  });

  it('rejects a duplicate email on the same course', async () => {
    const courses = createMemoryCourseRepository();
    const course = await createCourseService(courses).create(AUTHOR, validCourse);
    const service = createEnrollmentService(createMemoryEnrollmentRepository(courses));
    await service.create(AUTHOR, {
      courseId: course.id,
      studentName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    });
    await expect(
      service.create(AUTHOR, {
        courseId: course.id,
        studentName: 'Lee Ka Ming',
        email: 'chan@ysk.hk',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' } satisfies Partial<AppError>);
  });

  it('rejects enrolment when the quota is full', async () => {
    const courses = createMemoryCourseRepository();
    const course = await createCourseService(courses).create(AUTHOR, {
      ...validCourse,
      quota: 1,
    });
    const service = createEnrollmentService(createMemoryEnrollmentRepository(courses));
    await service.create(AUTHOR, {
      courseId: course.id,
      studentName: 'Chan Tai Man',
      email: 'chan@ysk.hk',
    });
    await expect(
      service.create(AUTHOR, {
        courseId: course.id,
        studentName: 'Lee Ka Ming',
        email: 'lee@ysk.hk',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT' } satisfies Partial<AppError>);
  });
});

describe('course HTTP', () => {
  const tokenOf = async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'course@ysk.hk',
      password: 'password1',
      displayName: 'Course',
    });
    expect(registered.status).toBe(201);
    return { app, token: registered.body.data.accessToken as string };
  };

  it('returns the success envelope', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/course')
      .set('authorization', `Bearer ${token}`)
      .send(validCourse);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ok: true,
      data: { title: 'Cantonese A1', quota: 8, startsOn: '2035-03-01' },
    });
  });

  it('returns VALIDATION_FAILED for quota 0', async () => {
    const { app, token } = await tokenOf();
    const res = await request(app)
      .post('/v1/course')
      .set('authorization', `Bearer ${token}`)
      .send({ ...validCourse, quota: 0 });
    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });

  it('returns UNAUTHENTICATED without a session', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const res = await request(app).post('/v1/course').send(validCourse);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ ok: false, error: { code: 'UNAUTHENTICATED' } });
  });

  it('enrols a student and rejects missing, duplicate, and full courses', async () => {
    const { app, token } = await tokenOf();
    const created = await request(app)
      .post('/v1/course')
      .set('authorization', `Bearer ${token}`)
      .send(validCourse);
    expect(created.status).toBe(201);
    const courseId = created.body.data.id as string;
    const ok = await request(app)
      .post('/v1/enrollment')
      .set('authorization', `Bearer ${token}`)
      .send({
        courseId,
        studentName: 'Chan Tai Man',
        email: 'chan@ysk.hk',
      });
    expect(ok.status).toBe(201);
    expect(ok.body.data.email).toBe('chan@ysk.hk');
    const duplicate = await request(app)
      .post('/v1/enrollment')
      .set('authorization', `Bearer ${token}`)
      .send({
        courseId,
        studentName: 'Lee Ka Ming',
        email: 'chan@ysk.hk',
      });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
    const missing = await request(app)
      .post('/v1/enrollment')
      .set('authorization', `Bearer ${token}`)
      .send({
        courseId: '33333333-3333-4333-a333-333333333333',
        studentName: 'Chan Tai Man',
        email: 'missing@ysk.hk',
      });
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ ok: false, error: { code: 'NOT_FOUND' } });

    const tiny = await request(app)
      .post('/v1/course')
      .set('authorization', `Bearer ${token}`)
      .send({ title: 'Admin briefing', quota: 1, startsOn: '2035-03-02' });
    expect(tiny.status).toBe(201);
    const firstSeat = await request(app)
      .post('/v1/enrollment')
      .set('authorization', `Bearer ${token}`)
      .send({
        courseId: tiny.body.data.id,
        studentName: 'Lee Ka Ming',
        email: 'lee@ysk.hk',
      });
    expect(firstSeat.status).toBe(201);
    const full = await request(app)
      .post('/v1/enrollment')
      .set('authorization', `Bearer ${token}`)
      .send({
        courseId: tiny.body.data.id,
        studentName: 'Wong Mei Ling',
        email: 'wong@ysk.hk',
      });
    expect(full.status).toBe(409);
    expect(full.body).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  });
});
