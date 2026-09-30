import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import { type CaptureStep, expandCaptureValue, loadCaptureScript } from './capture-script';
import { destProcessEnv } from './dest-env';
import { defaultDest, exampleRoot } from './paths';
import { run } from './spawn';
import { loadSpec } from './spec';

export const CAPTURE_API_PORT = 13001;
export const CAPTURE_WEB_PORT = 15173;

const waitFor = async (url: string, timeoutMs: number): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`timed out waiting for ${url}`);
};

const patchEnvPorts = (dest: string): void => {
  const envPath = join(dest, '.env');
  if (!existsSync(envPath)) throw new Error(`missing ${envPath} (apply the example first)`);
  const next = readFileSync(envPath, 'utf8')
    .split('\n')
    .map((line) => {
      if (line.startsWith('API_PORT=')) return `API_PORT=${CAPTURE_API_PORT}`;
      if (line.startsWith('API_PUBLIC_URL='))
        return `API_PUBLIC_URL=http://localhost:${CAPTURE_API_PORT}`;
      if (line.startsWith('WEB_PUBLIC_URL='))
        return `WEB_PUBLIC_URL=http://localhost:${CAPTURE_WEB_PORT}`;
      return line;
    })
    .join('\n');
  writeFileSync(envPath, next.endsWith('\n') ? next : `${next}\n`);
};

const killTree = (pid: number): void => {
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
};

const fillField = async (page: Page, label: string, value: string): Promise<void> => {
  const locator = page.getByLabel(label, { exact: true });
  await locator.waitFor();
  const tag = await locator.evaluate((el) => el.tagName);
  if (tag === 'SELECT') {
    await locator.selectOption({ label: value });
    return;
  }
  await locator.fill(value);
};

export const runCaptureSteps = async (
  page: Page,
  steps: readonly CaptureStep[],
  opts: { webOrigin: string; apiOrigin: string; shotsDir: string },
): Promise<string[]> => {
  const written: string[] = [];
  const shot = async (name: string, fullPage = true): Promise<void> => {
    const path = join(opts.shotsDir, name);
    await page.screenshot({ path, fullPage });
    written.push(path);
  };
  for (const step of steps) {
    if ('login' in step) {
      await page.goto(`${opts.webOrigin}/login`);
      await page.getByRole('heading', { name: 'Sign in' }).waitFor();
      await shot('01-login.png');
      await page.getByLabel('Email').fill('user@ysk.hk');
      await page.getByLabel('Password').fill('ysk-user-dev');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL(/\/users/);
      continue;
    }
    if ('goto' in step) {
      await page.goto(`${opts.webOrigin}${step.goto}`);
      continue;
    }
    if ('click' in step) {
      await page.getByRole(step.click.role, { name: step.click.name }).click();
      continue;
    }
    if ('fill' in step) {
      await fillField(page, step.fill.label, expandCaptureValue(step.fill.value));
      continue;
    }
    if ('submit' in step) {
      await page.getByRole('button', { name: step.submit }).click();
      continue;
    }
    if ('waitText' in step) {
      await page.getByText(step.waitText).waitFor();
      continue;
    }
    if ('waitCell' in step) {
      await page.getByRole('cell', { name: step.waitCell }).waitFor();
      continue;
    }
    if ('waitAlert' in step) {
      await page.getByRole('alert').waitFor();
      continue;
    }
    if ('waitUrl' in step) {
      await page.waitForURL(new RegExp(step.waitUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      continue;
    }
    if ('waitHeading' in step) {
      await page.getByRole('heading', { name: step.waitHeading }).waitFor();
      continue;
    }
    if ('shot' in step) {
      await shot(step.shot, step.fullPage !== false);
      continue;
    }
    const shotName = step.docs.shot ?? '05-docs.png';
    await page.goto(`${opts.apiOrigin}/docs`);
    await page.getByText(step.docs.path).first().waitFor({ timeout: 20_000 });
    await page.getByText(step.docs.path).first().click();
    await page.getByRole('heading', { name: step.docs.path }).first().waitFor();
    const path = join(opts.shotsDir, shotName);
    await page.screenshot({ path, fullPage: false });
    written.push(path);
  }
  return written;
};

export type CaptureOptions = {
  slug: string;
  dest?: string;
};

export const captureExample = async (opts: CaptureOptions): Promise<string[]> => {
  const spec = loadSpec(opts.slug);
  const dest = resolve(opts.dest ?? defaultDest(spec.slug));
  if (!existsSync(join(dest, 'package.json'))) {
    throw new Error(`apply ${spec.slug} first (missing ${dest})`);
  }
  patchEnvPorts(dest);
  const env: NodeJS.ProcessEnv = {
    ...destProcessEnv(dest),
    API_PORT: String(CAPTURE_API_PORT),
    API_PUBLIC_URL: `http://localhost:${CAPTURE_API_PORT}`,
    WEB_PUBLIC_URL: `http://localhost:${CAPTURE_WEB_PORT}`,
  };
  delete env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
  if (spec.db === 'sqlite') {
    const dbFile = join(dest, 'apps/api/dev.db');
    if (existsSync(dbFile)) rmSync(dbFile);
    run('pnpm', ['--filter', '@ysk/api', 'exec', 'prisma', 'db', 'push'], {
      cwd: dest,
      env,
      stdio: 'inherit',
    });
    run('pnpm', ['db:seed'], { cwd: dest, env, stdio: 'inherit' });
  }
  run('pnpm', ['--filter', '@ysk/web', 'build'], { cwd: dest, env, stdio: 'inherit' });

  const api = spawn(
    'pnpm',
    ['--filter', '@ysk/api', 'exec', 'tsx', '--env-file=../../.env', 'src/main.ts'],
    {
      cwd: dest,
      env,
      detached: true,
      stdio: 'inherit',
    },
  );
  const web = spawn(
    'pnpm',
    [
      '--filter',
      '@ysk/web',
      'exec',
      'vite',
      'preview',
      '--host',
      'localhost',
      '--port',
      String(CAPTURE_WEB_PORT),
      '--strictPort',
    ],
    { cwd: dest, env, detached: true, stdio: 'inherit' },
  );
  try {
    await waitFor(`http://localhost:${CAPTURE_API_PORT}/health`, 60_000);
    await waitFor(`http://localhost:${CAPTURE_WEB_PORT}`, 60_000);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const shots = join(exampleRoot(spec.slug), 'screenshots');
    mkdirSync(shots, { recursive: true });
    const written = await runCaptureSteps(page, loadCaptureScript(spec.slug).steps, {
      webOrigin: `http://localhost:${CAPTURE_WEB_PORT}`,
      apiOrigin: `http://localhost:${CAPTURE_API_PORT}`,
      shotsDir: shots,
    });
    await browser.close();
    return written;
  } finally {
    if (api.pid) killTree(api.pid);
    if (web.pid) killTree(web.pid);
  }
};
