import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { parsePrivateMonsterFile } from './privateDndMonsterImportParser.js';

const execFileAsync = promisify(execFile);
type SmokeCase = { name: string; passed: boolean; detail?: string };

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function run(): Promise<SmokeCase[]> {
  const cases: SmokeCase[] = [];
  const check = async (name: string, verify: () => Promise<void> | void) => {
    try { await verify(); cases.push({ name, passed: true }); }
    catch (error) { cases.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) }); }
  };
  await check('json', () => {
    const parsed = parsePrivateMonsterFile('training.json', JSON.stringify([{ name: 'Training Goblin', ac: 15, hp: { average: 7, formula: '2d6' }, speed: { walk: 30 }, str: 8, dex: 14, actions: [{ name: 'Training Scimitar', toHit: 4, damage: '1d6+2' }] }]));
    assert(parsed.records.length === 1 && parsed.records[0]?.actions[0]?.damageFormula === '1d6+2', 'JSON mapper changed');
  });
  await check('jsonl', () => assert(parsePrivateMonsterFile('training.jsonl', '{"name":"Training Skeleton","ac":13}\n').records.length === 1, 'JSONL mapper changed'));
  await check('csv', () => assert(parsePrivateMonsterFile('training.csv', 'name,type,ac,hp\nTraining Scout,humanoid,12,9\n').records.length === 1, 'CSV mapper changed'));
  await check('unsupported', () => assert(parsePrivateMonsterFile('notes.pdf', 'ignored').issues.length === 1, 'unsupported parsing changed'));
  await check('cli_dry_run_counts_unsupported_files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'dnd-private-monster-smoke-'));
    try {
      await writeFile(join(directory, 'training.json'), JSON.stringify([{ name: 'Training Goblin', ac: 15 }]));
      await writeFile(join(directory, 'unsupported.pdf'), 'not parsed');
      const { stdout } = await execFileAsync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server/tools/importPrivateDndMonsters.ts', '--dry-run', '--input', directory, '--world-server-id', 'smoke-world', '--created-by-user-id', 'smoke-user'], { cwd: process.cwd() });
      const result = JSON.parse(stdout) as { supportedFiles?: number; unsupportedFiles?: number; parsedRecords?: number; skippedRecords?: number };
      assert(result.supportedFiles === 1 && result.unsupportedFiles === 1 && result.parsedRecords === 1 && result.skippedRecords === 1, 'dry-run counts changed');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  return cases;
}

run().then((cases) => {
  const failed = cases.filter((item) => !item.passed);
  console.log(JSON.stringify({ total: cases.length, passed: cases.length - failed.length, failed: failed.length, cases }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
});
