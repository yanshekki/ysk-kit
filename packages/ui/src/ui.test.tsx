import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AppShell } from './app-shell';
import { Button } from './button';
import { Can } from './can';
import { cn } from './cn';
import { EmptyState } from './empty-state';
import { ErrorBanner } from './error-banner';
import { FormField } from './form-field';
import { Input } from './input';
import { PageHeader } from './page-header';
import { Spinner } from './spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

afterEach(() => {
  cleanup();
});

describe('@ysk/ui', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'px-4')).toContain('px-4');
  });

  it('renders button variants', () => {
    render(
      <>
        <Button>Save</Button>
        <Button variant="outline" size="sm">
          Cancel
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('border');
  });

  it('gates Can by permission', () => {
    const { rerender } = render(
      // biome-ignore lint/a11y/useValidAriaRole: Can.role is UserRole, not ARIA
      <Can role="USER" permission="user.create">
        <span>secret</span>
      </Can>,
    );
    expect(screen.queryByText('secret')).toBeNull();
    rerender(
      // biome-ignore lint/a11y/useValidAriaRole: Can.role is UserRole, not ARIA
      <Can role="ADMIN" permission="user.create">
        <span>secret</span>
      </Can>,
    );
    expect(screen.getByText('secret')).toBeDefined();
  });

  it('renders form field error, empty state, banner, shell, table, spinner', () => {
    render(
      <AppShell brand={<span>YSK</span>} nav={<a href="/">Home</a>} trailing={<span>out</span>}>
        <PageHeader title="Users" description="All accounts" actions={<Button>New</Button>} />
        <FormField label="Email" htmlFor="e" error="Required">
          <Input id="e" />
        </FormField>
        <ErrorBanner message="Nope" />
        <EmptyState title="None" description="Add one" action={<Button>Add</Button>} />
        <Spinner />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Ki</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </AppShell>,
    );
    expect(screen.getByText('Users')).toBeDefined();
    expect(screen.getByText('Required')).toBeDefined();
    expect(screen.getByText('Nope')).toBeDefined();
    expect(screen.getByText('None')).toBeDefined();
    expect(screen.getByLabelText('Loading')).toBeDefined();
    expect(screen.getByText('Ki')).toBeDefined();
  });
});
