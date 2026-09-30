import { slicePage } from '@ysk/application';
import type { EnrollmentDto } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IEnrollmentRepository } from '../domain/enrollment-repository';

const toDto = (row: {
  id: string;
  courseId: string;
  studentName: string;
  email: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): EnrollmentDto => ({
  id: row.id,
  courseId: row.courseId,
  studentName: row.studentName,
  email: row.email,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaEnrollmentRepository = (prisma: PrismaClient): IEnrollmentRepository => ({
  async create(authorId, input) {
    const row = await prisma.enrollment.create({
      data: {
        courseId: input.courseId,
        studentName: input.studentName,
        email: input.email,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.enrollment.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getCourse(id) {
    const row = await prisma.course.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, authorId: row.authorId, quota: row.quota };
  },
  async countForCourse(courseId) {
    return prisma.enrollment.count({ where: { courseId } });
  },
  async findByCourseEmail(courseId, email) {
    const row = await prisma.enrollment.findUnique({
      where: { courseId_email: { courseId, email } },
    });
    if (!row) return null;
    return row;
  },
});
