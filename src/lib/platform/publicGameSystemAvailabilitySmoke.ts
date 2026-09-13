/**
 * Public game-system availability + map background source guard smoke.
 *
 * AI-LANDMARK: PUBLIC_SYSTEM_SCOPE_SMOKE_V1
 *
 * Protects the two invariants this consolidation pass depends on: D&D is the
 * only publicly available system right now, and a map background reference can
 * never be a value that only resolves on one machine or in one browser tab.
 */

import {
  ACTIVE_PUBLIC_SYSTEM_IDS,
  ACTIVE_PUBLIC_WORKSPACE_SYSTEMS,
  PAUSED_PUBLIC_SYSTEM_IDS,
  isPausedPublicSystemId,
  isPubliclyAvailableSystemId,
  isPubliclyAvailableWorkspaceSystem,
  pausedSystemDisplayName,
  pausedSystemNotice,
} from './publicGameSystemAvailability';
import { checkMapBackgroundSource, mapBackgroundRejectionText } from '../map/mapBackgroundSource';

const cases: string[] = [];
function check(name: string, condition: unknown): void {
  if (!condition) throw new Error(`failed: ${name}`);
  cases.push(name);
}

// ── public system scope ────────────────────────────────────────────────────
check('dnd is publicly available', isPubliclyAvailableSystemId('dnd5e-2024'));
check('dnd variants are publicly available', isPubliclyAvailableSystemId('dnd5e') && isPubliclyAvailableSystemId('DND5E-2024'));
check('coc is not publicly available', !isPubliclyAvailableSystemId('coc7e'));
check('cp red is not publicly available', !isPubliclyAvailableSystemId('cp-red'));

check('coc is recognised as paused, not unknown', isPausedPublicSystemId('coc7e'));
check('cp red is recognised as paused', isPausedPublicSystemId('cp-red') && isPausedPublicSystemId('cyberpunk-red'));
check('dnd is never paused', !isPausedPublicSystemId('dnd5e-2024'));
check('an unknown system is neither available nor labelled a paused first-party system',
  !isPubliclyAvailableSystemId('warhammer') && !isPausedPublicSystemId('warhammer'));
check('undefined is handled', !isPubliclyAvailableSystemId(undefined) && !isPausedPublicSystemId(undefined));

check('only dnd is an active workspace system',
  ACTIVE_PUBLIC_WORKSPACE_SYSTEMS.length === 1 && ACTIVE_PUBLIC_WORKSPACE_SYSTEMS[0] === 'D&D');
check('the workspace predicate agrees',
  isPubliclyAvailableWorkspaceSystem('D&D')
  && !isPubliclyAvailableWorkspaceSystem('CoC')
  && !isPubliclyAvailableWorkspaceSystem('CP'));
check('active and paused lists do not overlap',
  !ACTIVE_PUBLIC_SYSTEM_IDS.some((id) => (PAUSED_PUBLIC_SYSTEM_IDS as readonly string[]).includes(id)));

// The notice must promise what the implementation actually does: keep records.
for (const locale of ['zh-CN', 'en'] as const) {
  for (const id of PAUSED_PUBLIC_SYSTEM_IDS) {
    const notice = pausedSystemNotice(id, locale);
    check(`${id}/${locale} notice names the system`, notice.includes(pausedSystemDisplayName(id, locale)));
    check(`${id}/${locale} notice promises records are kept`,
      locale === 'en' ? /kept/i.test(notice) && /not.*deleted|nothing has been deleted/i.test(notice) : notice.includes('保留'));
    check(`${id}/${locale} notice says temporary`,
      locale === 'en' ? /temporarily/i.test(notice) : notice.includes('暂时'));
  }
}
check('an unknown system still gets a usable label',
  pausedSystemDisplayName('warhammer', 'en') === 'This game system');

// ── map background source guard ────────────────────────────────────────────
check('https is accepted', (() => {
  const r = checkMapBackgroundSource('https://example.test/map.png');
  return r.ok && r.url === 'https://example.test/map.png';
})());
check('http is accepted', checkMapBackgroundSource('http://example.test/map.png').ok);
check('a site-relative path is accepted', checkMapBackgroundSource('/maps/tavern.png').ok);
check('surrounding whitespace is trimmed', (() => {
  const r = checkMapBackgroundSource('  https://example.test/a.png  ');
  return r.ok && r.url === 'https://example.test/a.png';
})());

// These are the values that must never reach a replayed, shared map record.
const rejected: Array<[string, string]> = [
  ['file:///C:/Users/me/map.png', 'localFilePath'],
  ['C:\\Users\\me\\map.png', 'localFilePath'],
  ['c:/users/me/map.png', 'localFilePath'],
  ['\\\\server\\share\\map.png', 'localFilePath'],
  ['blob:http://localhost:5173/9f1c-2a', 'objectUrl'],
  ['data:image/png;base64,iVBORw0KGgo=', 'inlineData'],
  ['javascript:alert(1)', 'unsupportedScheme'],
  ['', 'empty'],
  ['   ', 'empty'],
];
for (const [value, reason] of rejected) {
  const result = checkMapBackgroundSource(value);
  check(`rejected: ${JSON.stringify(value)}`, result.ok === false);
  check(`rejected for the right reason: ${JSON.stringify(value)}`,
    result.ok === false && result.reason === reason);
}
check('every rejection has bilingual guidance', rejected.every(([, reason]) =>
  mapBackgroundRejectionText(reason as never, 'en').length > 10
  && mapBackgroundRejectionText(reason as never, 'zh-CN').length > 5));
check('the local-path message directs the user to the durable asset upload',
  /upload local file/i.test(mapBackgroundRejectionText('localFilePath', 'en')));

console.log(JSON.stringify({ status: 'passed', suite: 'publicGameSystemAvailability', assertions: cases.length }, null, 2));
