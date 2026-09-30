import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyExample } from './apply';
import { HELP } from './help';
import { hasExampleCatalogue, listExampleSlugs, loadSpec } from './spec';

const catalogue = hasExampleCatalogue();

describe('examples apply', () => {
  it('documents apply and capture', () => {
    expect(HELP).toContain('apply <slug>');
    expect(HELP).toContain('capture <slug>');
    expect(HELP).toContain('examples/README.md');
  });

  it.skipIf(!catalogue)('loads clinic-booking spec', () => {
    const spec = loadSpec('clinic-booking');
    expect(spec.modules[0]?.name).toBe('appointment');
    expect(spec.preset).toBe('thin');
    expect(spec.db).toBe('sqlite');
    expect(spec.admin).toBe(false);
    expect(spec.mobile).toBe(false);
  });

  it.skipIf(!catalogue)('loads every catalogue spec', () => {
    const slugs = listExampleSlugs();
    expect(slugs).toEqual([
      'clinic-booking',
      'course-enrollment',
      'crm-contacts',
      'event-rsvp',
      'field-work-orders',
      'helpdesk-tickets',
      'inventory-stock',
      'invoice-quotes',
      'job-board',
      'membership-club',
    ]);
    for (const slug of slugs) {
      const spec = loadSpec(slug);
      expect(spec.slug).toBe(slug);
      expect(spec.preset).toBe('thin');
      expect(spec.db).toBe('sqlite');
      expect(spec.modules.length).toBeGreaterThan(0);
    }
    expect(loadSpec('helpdesk-tickets').capabilities).toEqual(['team']);
    expect(loadSpec('membership-club').capabilities).toEqual(['team', 'billing']);
    expect(loadSpec('field-work-orders').mobile).toBe(true);
    expect(loadSpec('field-work-orders').capabilities).toEqual(['push']);
  });

  const skipApply = (slug: string): string => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-ex-')), slug);
    applyExample({
      slug,
      dest,
      skipInstall: true,
      skipVerify: true,
      stdio: 'pipe',
    });
    return dest;
  };

  it.skipIf(!catalogue)('applies overlay onto a generated dest without install', () => {
    const dest = skipApply('clinic-booking');
    const dto = readFileSync(join(dest, 'packages/contracts/src/dto/appointment.ts'), 'utf8');
    expect(dto).toContain('patientName');
    expect(dto).toContain('HkPhoneSchema');
    const service = readFileSync(
      join(dest, 'apps/api/src/modules/appointment/application/appointment-service.ts'),
      'utf8',
    );
    expect(service).toContain('CONFLICT');
    expect(service).toContain('VALIDATION_FAILED');
    const schema = readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('durationMin');
    expect(schema).toContain('patientName');
    expect(schema).not.toMatch(/model Appointment \{[^}]*title String/s);
    const page = readFileSync(
      join(dest, 'apps/web/src/features/appointment/appointment-page.tsx'),
      'utf8',
    );
    expect(page).toContain('No appointments');
    expect(page).toContain('Patient name');
    const router = readFileSync(join(dest, 'apps/web/src/router.tsx'), 'utf8');
    expect(router).toContain('to="/appointment"');
    const appTs = readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8');
    expect(appTs.indexOf('registerAppointmentRoutes')).toBeGreaterThan(-1);
    expect(appTs.indexOf('registerAppointmentRoutes')).toBeLessThan(
      appTs.indexOf('app.use(errorHandler)'),
    );
  });

  it.skipIf(!catalogue)('shares the contact memory repo with follow-up', () => {
    const dest = skipApply('crm-contacts');
    const dto = readFileSync(join(dest, 'packages/contracts/src/dto/contact.ts'), 'utf8');
    expect(dto).toContain('email');
    expect(dto).toContain('LEAD');
    const memory = readFileSync(join(dest, 'apps/api/src/create-memory-input.ts'), 'utf8');
    expect(memory).toContain('const contactRepo = createMemoryContactRepository()');
    expect(memory).toContain('createMemoryFollowUpRepository(contactRepo)');
    const schema = readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('model Contact');
    expect(schema).toContain('model FollowUp');
    const router = readFileSync(join(dest, 'apps/web/src/router.tsx'), 'utf8');
    expect(router).toContain('to="/contact"');
    expect(router).toContain('to="/follow-up"');
  });

  it.skipIf(!catalogue)('wires ticket membership through the team org repo', () => {
    const dest = skipApply('helpdesk-tickets');
    const memory = readFileSync(join(dest, 'apps/api/src/create-memory-input.ts'), 'utf8');
    expect(memory).toContain('createMemoryTicketRepository(orgs)');
    const dto = readFileSync(join(dest, 'packages/contracts/src/dto/ticket.ts'), 'utf8');
    expect(dto).toContain('organizationId');
    const router = readFileSync(join(dest, 'apps/web/src/router.tsx'), 'utf8');
    expect(router).toContain('to="/orgs"');
    expect(router).toContain('Orgs');
    const appTs = readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8');
    expect(appTs.indexOf('registerTicketRoutes')).toBeGreaterThan(-1);
    expect(appTs.indexOf('registerTicketRoutes')).toBeLessThan(
      appTs.indexOf('app.use(errorHandler)'),
    );
  });

  it.skipIf(!catalogue)('injects the job queue into the work-order service', () => {
    const dest = skipApply('field-work-orders');
    const composition = readFileSync(join(dest, 'apps/api/src/composition.ts'), 'utf8');
    expect(composition).toContain(
      'createWorkOrderService(createPrismaWorkOrderRepository(prisma), queue)',
    );
    const memory = readFileSync(join(dest, 'apps/api/src/create-memory-input.ts'), 'utf8');
    expect(memory).toContain('createWorkOrderService(createMemoryWorkOrderRepository(), queue)');
    expect(memory).toMatch(/return \{ input, otpSink, mail, jobs, realtime, push/);
    const types = readFileSync(
      join(dest, 'packages/contracts/src/enums/notification-type.ts'),
      'utf8',
    );
    expect(types).toContain('WORK_ASSIGNED');
    expect(types).toContain('work.assigned');
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(true);
    const mobileApp = readFileSync(join(dest, 'apps/mobile/src/app.tsx'), 'utf8');
    expect(mobileApp).not.toContain('InviteScreen');
    const schema = readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('model Device');
    expect(schema).toContain('model WorkOrder');
    expect(schema).not.toContain('@db.');
  });
});
