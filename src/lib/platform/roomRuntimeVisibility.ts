/**
 * Viewer-safe Runtime display contracts. These are presentation values emitted
 * by the Room Server after it has resolved a verified room member; they are not
 * client-side permissions and must never be used to authorize mutations.
 */

export type RuntimeVisibility = 'hostFull' | 'ownerFull' | 'partyPublic' | 'publicObserved' | 'investigated';

export type RuntimeInjuryStage = 'uninjured' | 'wounded' | 'bloodied' | 'nearDeath' | 'defeated';

export type RuntimeHpDisplay =
  | { kind: 'exact'; current?: number; max?: number; temporary?: number }
  | { kind: 'stage'; stage: RuntimeInjuryStage }
  | { kind: 'unknown' };

export type RuntimeAcDisplay =
  | { kind: 'exact'; value: number }
  | { kind: 'unknown' };

export type RuntimeTokenRelation = 'self' | 'ally' | 'enemy' | 'npc' | 'object' | 'unknown';

const injuryLabels: Record<RuntimeInjuryStage, { zh: string; en: string }> = {
  uninjured: { zh: '未受伤', en: 'Uninjured' },
  wounded: { zh: '轻伤', en: 'Wounded' },
  bloodied: { zh: '重伤', en: 'Bloodied' },
  nearDeath: { zh: '濒死', en: 'Near death' },
  defeated: { zh: '已倒下', en: 'Defeated' },
};

/** Presentation helper only. Missing or unknown data must stay hidden. */
export function runtimeHpDisplayLabel(display: RuntimeHpDisplay | undefined, locale: 'zh' | 'en' = 'zh'): string {
  if (!display || display.kind === 'unknown') return locale === 'en' ? 'HP: Unknown' : 'HP：未知';
  if (display.kind === 'stage') return locale === 'en' ? `Injury: ${injuryLabels[display.stage].en}` : `生命状态：${injuryLabels[display.stage].zh}`;
  const base = `HP ${display.current ?? '—'}${display.max === undefined ? '' : `/${display.max}`}`;
  return display.temporary ? `${base} (${locale === 'en' ? 'Temp' : '临时'} ${display.temporary})` : base;
}

/** Presentation helper only. It never falls back to an unprojected AC value. */
export function runtimeAcDisplayLabel(display: RuntimeAcDisplay | undefined, locale: 'zh' | 'en' = 'zh'): string {
  return display?.kind === 'exact' ? `AC ${display.value}` : locale === 'en' ? 'AC: Unknown' : 'AC：未知';
}
