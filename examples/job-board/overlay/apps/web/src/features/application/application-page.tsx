import { CreateApplicationCommandSchema } from '@ysk/contracts';
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
import { createApplicationHooks, createJobHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const jobHooks = createJobHooks(api);
const applicationHooks = createApplicationHooks(api);

const selectClass =
  'flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm outline-none focus:border-zinc-500';

export function ApplicationPage() {
  const jobs = jobHooks.useList();
  const list = applicationHooks.useList();
  const create = applicationHooks.useCreate();
  const [jobId, setJobId] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [cover, setCover] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];
  const openings = jobs.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = CreateApplicationCommandSchema.safeParse({
      jobId,
      applicantName,
      email,
      cover,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setApplicantName('');
        setEmail('');
        setCover('');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Applications"
        description="Apply only after the job is published. Same job plus email is CONFLICT."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Job" htmlFor="application-job">
          <select
            id="application-job"
            className={selectClass}
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            required
          >
            <option value="">Select…</option>
            {openings.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Applicant name" htmlFor="application-name">
          <Input
            id="application-name"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Email" htmlFor="application-email">
          <Input
            id="application-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Cover" htmlFor="application-cover">
          <Input
            id="application-cover"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
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
        <EmptyState title="No applications" description="Apply to a published job." />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cover</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.applicantName}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{item.cover}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
