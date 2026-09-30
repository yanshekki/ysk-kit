import { CreateJobCommandSchema } from '@ysk/contracts';
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
import { createJobHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const hooks = createJobHooks(api);

export function JobPage() {
  const list = hooks.useList();
  const create = hooks.useCreate();
  const publish = hooks.usePublish();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateJobCommandSchema.safeParse({ title, department });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setTitle('');
        setDepartment('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Jobs"
        description="New jobs start unpublished. Publish before anyone can apply."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Title" htmlFor="job-title">
          <Input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        <FormField label="Department" htmlFor="job-department">
          <Input
            id="job-department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
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
        <EmptyState title="No jobs" description="Create a job to populate this table." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{item.department}</TableCell>
                <TableCell>{item.published ? 'Published' : 'Unpublished'}</TableCell>
                <TableCell>
                  {item.published ? null : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => publish.mutate(item.id)}
                    >
                      Publish
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
