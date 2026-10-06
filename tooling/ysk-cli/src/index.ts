import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addCapability } from './add-capability';
import { addModule } from './add-module';
import { checkAgent, formatAgentFindings } from './check-agent';
import { doctor, formatDoctorReport } from './doctor';
import { generateOpenApi } from './generate-openapi';
import { HELP } from './help';
import { checkPlan, localIsoDate, writePlan } from './plan';
import { upgrade } from './upgrade';

const args = process.argv.slice(2);
const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = resolve(process.env.YSK_ROOT ?? kitRoot);

const help = (): void => {
  console.log(HELP);
};

try {
  if (args[0] === 'add' && args[1] && args[1] !== 'module') {
    const logs = addCapability(args[1], root);
    for (const line of logs) console.log(line);
    process.exit(0);
  }

  if (args[0] === 'add' && args[1] === 'module' && args[2]) {
    const name = args[2];
    const logs = addModule(root, name, {
      prisma: args.includes('--prisma'),
      web: args.includes('--web') || !args.includes('--no-web'),
    });
    for (const line of logs) console.log(line);
    process.exit(0);
  }

  if (args[0] === 'generate' && args[1] === 'openapi') {
    const out = generateOpenApi(root);
    console.log(`wrote ${out}`);
    process.exit(0);
  }

  if (args[0] === 'check' && args[1] === 'agent') {
    const findings = checkAgent(root);
    console.log(formatAgentFindings(findings));
    process.exit(findings.length === 0 ? 0 : 1);
  }

  if (args[0] === 'doctor') {
    const report = doctor({ productRoot: root, kitRoot });
    if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
    else console.log(formatDoctorReport(report));
    process.exit(report.ok ? 0 : 1);
  }

  if (args[0] === 'plan' && args[1] === '--check') {
    const fileArg = args[2];
    if (!fileArg || fileArg.startsWith('-')) {
      throw new Error('plan --check requires a markdown file');
    }
    const resolved = existsSync(resolve(fileArg)) ? resolve(fileArg) : resolve(root, fileArg);
    const result = checkPlan({ file: resolved, kitRoot });
    if (result.ok) {
      console.log('ysk-kit plan --check: ok');
      process.exit(0);
    }
    for (const line of result.errors) console.error(line);
    process.exit(1);
  }

  if (args[0] === 'plan' && args[1] && !args[1].startsWith('-')) {
    const dateFlag = args.indexOf('--date');
    const dateArg = dateFlag >= 0 ? args[dateFlag + 1] : localIsoDate();
    const logs = writePlan({
      productRoot: root,
      kitRoot,
      slug: args[1],
      date: dateArg ?? localIsoDate(),
      force: args.includes('--force'),
    });
    for (const line of logs) console.log(line);
    process.exit(0);
  }

  if (args[0] === 'upgrade') {
    const logs = upgrade({
      productRoot: root,
      kitRoot,
      dryRun: args.includes('--dry-run'),
    });
    for (const line of logs) console.log(line);
    process.exit(0);
  }

  help();
  process.exit(args.length === 0 ? 0 : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
