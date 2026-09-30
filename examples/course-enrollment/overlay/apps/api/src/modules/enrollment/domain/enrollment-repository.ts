import type {
  CreateEnrollmentCommand,
  EnrollmentDto,
  PageQuery,
  PaginatedEnrollment,
} from '@ysk/contracts';

export type EnrollmentRecord = {
  id: string;
  courseId: string;
  studentName: string;
  email: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EnrollmentCourseRef = { id: string; authorId: string; quota: number };

export interface IEnrollmentRepository {
  create(authorId: string, input: CreateEnrollmentCommand): Promise<EnrollmentDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedEnrollment>;
  getCourse(id: string): Promise<EnrollmentCourseRef | null>;
  countForCourse(courseId: string): Promise<number>;
  findByCourseEmail(courseId: string, email: string): Promise<EnrollmentRecord | null>;
}
