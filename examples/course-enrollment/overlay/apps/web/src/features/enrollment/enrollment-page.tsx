import { CreateEnrollmentCommandSchema } from '@ysk-kit/contracts';
import {
  Button,
  EmptyState,
  ErrorBanner,
  FormField,
  Input,
  PageHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ysk-kit/ui';
import { createCourseHooks, createEnrollmentHooks } from '@ysk-kit/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const courseHooks = createCourseHooks(api);
const enrollmentHooks = createEnrollmentHooks(api);

const selectClass =
  'flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-zinc-500';

export function EnrollmentPage() {
  const courses = courseHooks.useList();
  const list = enrollmentHooks.useList();
  const create = enrollmentHooks.useCreate();
  const [courseId, setCourseId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];
  const offered = courses.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateEnrollmentCommandSchema.safeParse({
      courseId,
      studentName,
      email,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setStudentName('');
        setEmail('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  const courseTitle = (id: string): string =>
    offered.find((course) => course.id === id)?.title ?? id;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Enrollments"
        description="A student email is unique per course. A full quota is rejected."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Course" htmlFor="enrollment-course">
          <select
            id="enrollment-course"
            className={selectClass}
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {offered.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Student name" htmlFor="enrollment-student">
          <Input
            id="enrollment-student"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Email" htmlFor="enrollment-email">
          <Input
            id="enrollment-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <Button type="submit" disabled={create.isPending}>
          Create
        </Button>
      </form>
      {formError ? <ErrorBanner message={formError} /> : null}
      {list.error ? <ErrorBanner message={list.error.message} /> : null}
      {list.isPending ? <Spinner /> : null}
      {!list.isPending && !list.error && items.length === 0 ? (
        <EmptyState title="No enrollments" description="Enrol a student on a course you own." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Course</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.studentName}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{courseTitle(item.courseId)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
