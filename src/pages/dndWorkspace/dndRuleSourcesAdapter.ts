/**
 * DND System Rule Sources adapter (static, scaffold only).
 * AI-LANDMARK: PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1
 *
 * Provides the DND rule-source list shown in the System Rule Sources shell.
 * No store / schema / rule data / Builder / Compendium / runtime effect.
 */
import type { SystemRuleSourceItem } from '../../lib/platform/systemRuleSources';

export const DND_RULE_SOURCES: SystemRuleSourceItem[] = [
  { id: 'dnd.2024-core',        name: '2024 Core Rules',           kind: 'core',                   status: 'enabled',    description: '' },
  { id: 'dnd.xanathar',         name: "Xanathar's Guide",          kind: 'expansion',              status: 'comingSoon', description: '' },
  { id: 'dnd.tasha',            name: "Tasha's Cauldron",          kind: 'expansion',              status: 'comingSoon', description: '' },
  { id: 'dnd.2014-legacy',      name: '2014 Legacy Content',       kind: 'legacy',                 status: 'comingSoon', description: '' },
  { id: 'dnd.community',        name: 'Community Rule Packages',   kind: 'communityRulePackage',   status: 'reserved',   description: '' },
  { id: 'dnd.player-custom',    name: 'Player Custom Rule Packages', kind: 'playerCustomRulePackage', status: 'reserved', description: '' },
];
