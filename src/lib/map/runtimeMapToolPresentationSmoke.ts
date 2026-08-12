import { getRuntimeMapToolPresentation } from './runtimeMapToolPresentation';

const checks: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

const host = getRuntimeMapToolPresentation(true, 'zh');
check('host tool order keeps core interactions before setup and Token', host.map((tool) => tool.id).join(',') === 'select,move,measure,background,grid,template,units');
check('host Token entry has a visible short label', host.find((tool) => tool.id === 'units')?.shortLabel === 'Token');
check('host background and grid labels are touch-readable', host.find((tool) => tool.id === 'background')?.shortLabel === '底图' && host.find((tool) => tool.id === 'grid')?.shortLabel === '网格');

const participant = getRuntimeMapToolPresentation(false, 'zh');
check('participant keeps only role-safe tools', participant.map((tool) => tool.id).join(',') === 'select,move,measure,template');
check('participant never receives host Token creation', !participant.some((tool) => tool.id === 'units'));
check('participant never receives background or grid setup', !participant.some((tool) => tool.id === 'background' || tool.id === 'grid'));

const english = getRuntimeMapToolPresentation(true, 'en');
check('English labels stay compact', english.map((tool) => tool.shortLabel).join(',') === 'Select,Move,Measure,Map,Grid,Area,Token');
check('presentation model returns every id exactly once', new Set(host.map((tool) => tool.id)).size === host.length);

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
