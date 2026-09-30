import type { CourseDto, CreateCourseCommand, PaginatedCourse } from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const courseResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedCourse>(`/v1/course${toQuery(query)}`),
  create: (body: CreateCourseCommand) =>
    http.request<CourseDto>('/v1/course', { method: 'POST', body: JSON.stringify(body) }),
});
