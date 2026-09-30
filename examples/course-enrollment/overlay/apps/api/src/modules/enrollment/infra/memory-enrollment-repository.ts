import { slicePage } from '@ysk-kit/application';
import type { EnrollmentDto } from '@ysk-kit/contracts';
import type {
  EnrollmentCourseRef,
  EnrollmentRecord,
  IEnrollmentRepository,
} from '../domain/enrollment-repository';

const toDto = (row: EnrollmentRecord): EnrollmentDto => ({
  id: row.id,
  courseId: row.courseId,
  studentName: row.studentName,
  email: row.email,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type CourseLookup = {
  getById: (id: string) => Promise<EnrollmentCourseRef | null>;
};

export const createMemoryEnrollmentRepository = (courses?: CourseLookup): IEnrollmentRepository => {
  const rows: EnrollmentRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: EnrollmentRecord = {
        id: crypto.randomUUID(),
        courseId: input.courseId,
        studentName: input.studentName,
        email: input.email,
        authorId,
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(row);
      return toDto(row);
    },
    async listForAuthor(authorId, query) {
      const mine = rows.filter((row) => row.authorId === authorId);
      const page = slicePage(mine, query.limit);
      return { items: page.items.map(toDto), nextCursor: page.nextCursor };
    },
    async getCourse(id) {
      if (!courses) return null;
      const row = await courses.getById(id);
      if (!row) return null;
      return { id: row.id, authorId: row.authorId, quota: row.quota };
    },
    async countForCourse(courseId) {
      return rows.filter((row) => row.courseId === courseId).length;
    },
    async findByCourseEmail(courseId, email) {
      return rows.find((row) => row.courseId === courseId && row.email === email) ?? null;
    },
  };
};
