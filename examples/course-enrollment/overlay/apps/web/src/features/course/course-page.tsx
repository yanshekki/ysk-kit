import { CreateCourseCommandSchema } from '@ysk/contracts';
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
} from '@ysk/ui';
import { createCourseHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const hooks = createCourseHooks(api);

const localDateValue = (): string => {
  const starts = new Date(Date.now() + 7 * 24 * 3600_000);
  return new Date(starts.getTime() - starts.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
};

export function CoursePage() {
  const list = hooks.useList();
  const create = hooks.useCreate();
  const [title, setTitle] = useState('');
  const [quota, setQuota] = useState('');
  const [startsOn, setStartsOn] = useState(localDateValue);
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateCourseCommandSchema.safeParse({
      title,
      quota: Number(quota),
      startsOn,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setTitle('');
        setQuota('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Courses"
        description="A course has a title, a positive quota, and an ISO start date."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Title" htmlFor="course-title">
          <Input
            id="course-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Quota" htmlFor="course-quota">
          <Input
            id="course-quota"
            type="number"
            min={1}
            value={quota}
            onChange={(e) => setQuota(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Starts on" htmlFor="course-starts-on">
          <Input
            id="course-starts-on"
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
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
        <EmptyState title="No courses" description="Create a course to populate this table." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Quota</TableHead>
              <TableHead>Starts on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.quota}</TableCell>
                <TableCell>{item.startsOn}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
