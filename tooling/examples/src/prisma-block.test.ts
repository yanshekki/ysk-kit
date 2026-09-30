import { describe, expect, it } from 'vitest';
import { replacePrismaModel } from './prisma-block';

describe('replacePrismaModel', () => {
  it('replaces an existing model block', () => {
    const schema = `generator client {
  provider = "prisma-client"
}

model Appointment {
  id    String @id
  title String
}

model User {
  id String @id
}
`;
    const next = replacePrismaModel(
      schema,
      'Appointment',
      `model Appointment {
  id          String @id
  patientName String
  durationMin Int
}
`,
    );
    expect(next).toContain('patientName');
    expect(next).toContain('durationMin');
    expect(next).not.toContain('title String');
    expect(next).toContain('model User');
  });

  it('appends when the model is missing', () => {
    const next = replacePrismaModel(
      'model User {\n  id String @id\n}\n',
      'Appointment',
      'model Appointment {\n  id String @id\n}\n',
    );
    expect(next).toContain('model User');
    expect(next).toContain('model Appointment');
  });
});
