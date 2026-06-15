/**
 * CP RED System Rule Sources adapter (static, scaffold only).
 * AI-LANDMARK: PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1
 *
 * Provides the CP RED rule-source list shown in the System Rule Sources shell.
 * No store / schema / rule data / Builder / Compendium / runtime effect.
 */
import type { SystemRuleSourceItem } from '../../lib/platform/systemRuleSources';

export const CPRED_RULE_SOURCES: SystemRuleSourceItem[] = [
  { id: 'cpred.core',          name: 'Cyberpunk RED Core',          kind: 'core',                    status: 'enabled',    description: '' },
  { id: 'cpred.black-chrome',  name: 'Black Chrome',                kind: 'expansion',               status: 'comingSoon', description: '' },
  { id: 'cpred.community',     name: 'Community Rule Packages',     kind: 'communityRulePackage',    status: 'reserved',   description: '' },
  { id: 'cpred.player-custom', name: 'Player Custom Rule Packages', kind: 'playerCustomRulePackage', status: 'reserved',   description: '' },
];
