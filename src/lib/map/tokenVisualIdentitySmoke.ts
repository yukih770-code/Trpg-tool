import { createMapToken } from './mapRuntimeTypes';
import { resolveTokenVisualIdentity } from './tokenVisualIdentity';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const imageToken = createMapToken({ id: 'image', name: 'Ariadne', x: 0, y: 0, size: 'medium', sourceType: 'manual', imageUrl: 'https://example.invalid/ariadne.png' });
const textToken = createMapToken({ id: 'heat', name: '热', x: 0, y: 0, size: 'medium', sourceType: 'roomActorBinding', hpSummary: { current: 8, max: 12 }, conditionSummary: ['专注'] });
const combatToken = createMapToken({ id: 'combat', name: 'Guard', x: 0, y: 0, size: 'medium', sourceType: 'combatant', combatantId: 'combat-1' });

const cases: Array<{ name: string; run: () => void }> = [
  { name: 'token with image resolves image', run: () => assert(resolveTokenVisualIdentity(imageToken).imageUrl === imageToken.imageUrl, 'image was not selected') },
  { name: 'image failure falls back to initials', run: () => { const identity = resolveTokenVisualIdentity(imageToken, { imageFailed: true }); assert(!identity.imageUrl && identity.initials === 'A', 'image fallback failed'); } },
  { name: 'token without image resolves initials', run: () => assert(resolveTokenVisualIdentity(textToken).initials === '热', 'initial fallback changed') },
  { name: 'missing display name resolves safe fallback', run: () => assert(resolveTokenVisualIdentity({ ...textToken, name: '', displayName: '' }).label === '?', 'missing label was unsafe') },
  { name: 'character heat has one visual identity', run: () => { const identity = resolveTokenVisualIdentity(textToken); assert(identity.label === '热' && identity.initials === '热', 'heat identity changed'); } },
  { name: 'combat marker is a boolean not another avatar', run: () => assert(resolveTokenVisualIdentity(combatToken).hasCombatLink, 'combat link marker missing') },
  { name: 'HP and condition remain external summaries', run: () => { const identity = resolveTokenVisualIdentity(textToken); assert(identity.hpSummary === 'HP 8/12' && identity.conditionSummary === '专注', 'summary missing'); } },
  { name: 'old manual token remains valid', run: () => assert(resolveTokenVisualIdentity(createMapToken({ id: 'old', name: 'Marker', x: 0, y: 0, size: 'medium', sourceType: 'manual' })).label === 'Marker', 'legacy token changed') },
];

const results = cases.map((test) => {
  try { test.run(); return { name: test.name, passed: true }; }
  catch (error) { return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) }; }
});
const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results }, null, 2));
if (failed.length) process.exitCode = 1;
