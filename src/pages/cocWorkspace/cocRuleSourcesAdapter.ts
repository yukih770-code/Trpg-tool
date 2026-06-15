/**
 * COC System Rule Sources adapter (static, scaffold only).
 * AI-LANDMARK: PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1
 *
 * Provides the COC rule-source list shown in the System Rule Sources shell.
 * Scenarios / Scenario Options are intentionally EXCLUDED — those belong to
 * Campaign / Module areas, not rule sources.
 * No store / schema / rule data / Builder / Compendium / runtime effect.
 */
import type { SystemRuleSourceItem } from '../../lib/platform/systemRuleSources';

export const COC_RULE_SOURCES: SystemRuleSourceItem[] = [
  { id: 'coc.core',          name: 'Core Rulebook',               kind: 'core',                    status: 'enabled',    description: '' },
  { id: 'coc.investigator',  name: 'Investigator Handbook',       kind: 'expansion',               status: 'comingSoon', description: '' },
  { id: 'coc.community',     name: 'Community Rule Packages',     kind: 'communityRulePackage',    status: 'reserved',   description: '' },
  { id: 'coc.player-custom', name: 'Player Custom Rule Packages', kind: 'playerCustomRulePackage', status: 'reserved',   description: '' },
];
