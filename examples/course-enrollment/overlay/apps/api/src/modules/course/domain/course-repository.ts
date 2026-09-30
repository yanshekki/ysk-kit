import type { CourseDto, CreateCourseCommand, PageQuery, PaginatedCourse } from '@ysk/contracts';

export type CourseRecord = {
  id: string;
  title: string;
  quota: number;
  startsOn: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface ICourseRepository {
  create(authorId: string, input: CreateCourseCommand): Promise<CourseDto>;
  listForAuthor(authorId: string, query: PageQuery): Promise<PaginatedCourse>;
  getById(id: string): Promise<CourseRecord | null>;
}
