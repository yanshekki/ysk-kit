import { CreateAppointmentCommandSchema } from '@ysk/contracts';
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
import { createAppointmentHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api } from '../../lib/client';

const hooks = createAppointmentHooks(api);

const localDatetimeValue = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function AppointmentPage() {
  const list = hooks.useList();
  const create = hooks.useCreate();
  const cancel = hooks.useCancel();
  const complete = hooks.useComplete();
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('+852');
  const [startsLocal, setStartsLocal] = useState(() =>
    localDatetimeValue(new Date(Date.now() + 24 * 3600_000).toISOString()),
  );
  const [durationMin, setDurationMin] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);
  const items = list.data?.items ?? [];

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const startsAt = new Date(startsLocal).toISOString();
    const parsed = CreateAppointmentCommandSchema.safeParse({
      patientName,
      phone,
      startsAt,
      durationMin: Number(durationMin),
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid');
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setPatientName('');
        setPhone('+852');
        setFormError(null);
      },
      onError: (error) => setFormError(error.message),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Book a clinic slot. Overlapping SCHEDULED times for the same account are rejected."
      />
      <form onSubmit={onSubmit} className="grid max-w-md gap-3" noValidate>
        <FormField label="Patient name" htmlFor="appointment-patient">
          <Input
            id="appointment-patient"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Phone" htmlFor="appointment-phone">
          <Input
            id="appointment-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Starts at" htmlFor="appointment-starts-at">
          <Input
            id="appointment-starts-at"
            type="datetime-local"
            value={startsLocal}
            onChange={(e) => setStartsLocal(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Duration (minutes)" htmlFor="appointment-duration">
          <Input
            id="appointment-duration"
            type="number"
            min={15}
            max={180}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
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
        <EmptyState
          title="No appointments"
          description="Create a booking to populate this table."
        />
      ) : null}
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Minutes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.patientName}</TableCell>
                <TableCell>{item.phone}</TableCell>
                <TableCell>{item.startsAt}</TableCell>
                <TableCell>{item.durationMin}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>
                  {item.status === 'SCHEDULED' ? (
                    <span className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => cancel.mutate(item.id)}
                      >
                        Cancel
                      </Button>
                      <Button type="button" size="sm" onClick={() => complete.mutate(item.id)}>
                        Complete
                      </Button>
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
    </section>
  );
}
