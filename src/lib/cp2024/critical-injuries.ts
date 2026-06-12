/**
 * critical-injuries.ts
 *
 * CP RED Critical Injury manual-tracking definitions (v1).
 *
 * AI-LANDMARK: CPRED_CRITICAL_INJURY_MANUAL_TRACKING
 *
 * Contract
 * ────────
 * • Pure data adapter — no React, no Zustand, no localStorage.
 * • Reuses the existing 2d6 tables in `cp-types.ts`
 *   (CP_CRIT_INJURIES_BODY / CP_CRIT_INJURIES_HEAD) as the single source
 *   of injury names and short effect summaries; this file only adds
 *   stable ids and a body/head location tag for manual tracking UI.
 * • No automatic damage triggers, armor ablation, ammo, treatment,
 *   death-save automation, or full damage pipeline.
 */

import {
  CP_CRIT_INJURIES_BODY,
  CP_CRIT_INJURIES_HEAD,
  type CpCritInjury,
} from '../cp-types';

export type CpCriticalInjuryLocation = 'body' | 'head';

export interface CpCriticalInjuryDefinition {
  /** Stable id, e.g. `body-2` / `head-12` (2d6 roll keyed). */
  id: string;
  name: string;
  location: CpCriticalInjuryLocation;
  /** Short summary reused from the existing table; not rulebook full text. */
  effectSummary: string;
  source: 'cpred-basic' | string;
  /** Original 2d6 table roll for reference display. */
  roll: number;
  quickFix?: string;
  treatmentDV?: number;
}

function toDefinition(
  entry: CpCritInjury,
  location: CpCriticalInjuryLocation,
): CpCriticalInjuryDefinition {
  return {
    id: `${location}-${entry.roll}`,
    name: entry.name,
    location,
    effectSummary: entry.effect,
    source: 'cpred-basic',
    roll: entry.roll,
    quickFix: entry.quickFix,
    treatmentDV: entry.treatmentDV,
  };
}

export const CP_CRITICAL_INJURY_BODY_DEFINITIONS: CpCriticalInjuryDefinition[] =
  CP_CRIT_INJURIES_BODY.map(entry => toDefinition(entry, 'body'));

export const CP_CRITICAL_INJURY_HEAD_DEFINITIONS: CpCriticalInjuryDefinition[] =
  CP_CRIT_INJURIES_HEAD.map(entry => toDefinition(entry, 'head'));

export const CP_CRITICAL_INJURY_DEFINITIONS: CpCriticalInjuryDefinition[] = [
  ...CP_CRITICAL_INJURY_BODY_DEFINITIONS,
  ...CP_CRITICAL_INJURY_HEAD_DEFINITIONS,
];

export function getCpCriticalInjuryDefinitions(
  location: CpCriticalInjuryLocation,
): CpCriticalInjuryDefinition[] {
  return location === 'body'
    ? CP_CRITICAL_INJURY_BODY_DEFINITIONS
    : CP_CRITICAL_INJURY_HEAD_DEFINITIONS;
}

export function getCpCriticalInjuryDefinitionById(
  id: string,
): CpCriticalInjuryDefinition | undefined {
  return CP_CRITICAL_INJURY_DEFINITIONS.find(def => def.id === id);
}

/** Best-effort reverse lookup for legacy plain-string injury entries. */
export function findCpCriticalInjuryDefinitionByName(
  name: string,
): CpCriticalInjuryDefinition | undefined {
  return CP_CRITICAL_INJURY_DEFINITIONS.find(def => def.name === name);
}
