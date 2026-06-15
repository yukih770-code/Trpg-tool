/**
 * SystemRuleSourcesShell
 *
 * AI-LANDMARK: PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1
 *
 * Platform-level reusable shell for a game system's "System Rule Sources" page.
 * Displays core/expansion/legacy rules, community rule packages, player custom
 * rule packages, and a low-weight rule-override/conflict reservation note.
 *
 * Scaffold only: no real source priority, load order, override, or conflict
 * detection. Does NOT affect Builder / Rules Compendium / runtime.
 *
 * Consumes: items + a translator + a class-string theme. Knows no system fields.
 */
import type {
  RuleSourceKind,
  RuleSourceStatus,
  SystemRuleSourceItem,
} from '../../lib/platform/systemRuleSources';
import { RULE_SOURCE_CORE_KINDS } from '../../lib/platform/systemRuleSources';

export type SystemRuleSourcesTheme = {
  panel: string;
  card: string;
  title: string;
  muted: string;
  badgeEnabled: string;
  badgePlanned: string;
  kindBadge: string;
};

export type SystemRuleSourcesShellProps = {
  items: SystemRuleSourceItem[];
  t: (key: string) => string;
  theme: SystemRuleSourcesTheme;
};

const STATUS_KEY: Record<RuleSourceStatus, string> = {
  enabled: 'systemRuleSources.status.enabled',
  comingSoon: 'systemRuleSources.status.comingSoon',
  reserved: 'systemRuleSources.status.reserved',
};

const KIND_KEY: Record<RuleSourceKind, string> = {
  core: 'systemRuleSources.kind.core',
  expansion: 'systemRuleSources.kind.expansion',
  legacy: 'systemRuleSources.kind.legacy',
  communityRulePackage: 'systemRuleSources.kind.communityRulePackage',
  playerCustomRulePackage: 'systemRuleSources.kind.playerCustomRulePackage',
};

export function SystemRuleSourcesShell({ items, t, theme }: SystemRuleSourcesShellProps) {
  const coreItems = items.filter((i) => RULE_SOURCE_CORE_KINDS.includes(i.kind));
  const communityItems = items.filter((i) => i.kind === 'communityRulePackage');
  const customItems = items.filter((i) => i.kind === 'playerCustomRulePackage');

  const renderItem = (item: SystemRuleSourceItem) => {
    const isEnabled = item.status === 'enabled';
    return (
      <div key={item.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 ${theme.card}`}>
        <div className="min-w-0">
          <div className={`text-sm font-bold ${theme.title}`}>{item.name}</div>
          <div className={`mt-0.5 flex flex-wrap items-center gap-2 text-[10px] ${theme.muted}`}>
            <span className={`border px-1.5 py-0.5 font-bold uppercase tracking-wider ${theme.kindBadge}`}>
              {t('systemRuleSources.typeLabel')}：{t(KIND_KEY[item.kind])}
            </span>
            {item.description && <span>{item.description}</span>}
          </div>
        </div>
        <span
          className={`shrink-0 border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isEnabled ? theme.badgeEnabled : theme.badgePlanned
          }`}
        >
          {t('systemRuleSources.statusLabel')}：{t(STATUS_KEY[item.status])}
        </span>
      </div>
    );
  };

  const renderSection = (titleKey: string, sectionItems: SystemRuleSourceItem[]) => {
    if (sectionItems.length === 0) return null;
    return (
      <div className={theme.panel}>
        <h3 className={`text-sm font-bold ${theme.title}`}>{t(titleKey)}</h3>
        <div className="mt-3 flex flex-col gap-2">{sectionItems.map(renderItem)}</div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className={`text-xl font-bold ${theme.title}`}>{t('systemRuleSources.title')}</h2>
        <p className={`mt-1 text-xs ${theme.muted}`}>{t('systemRuleSources.subtitle')}</p>
      </div>

      {renderSection('systemRuleSources.section.coreExpansion', coreItems)}
      {renderSection('systemRuleSources.section.community', communityItems)}
      {renderSection('systemRuleSources.section.custom', customItems)}

      {/* Rule override / conflict reservation — low weight, no real logic */}
      <div className={`${theme.panel} opacity-90`}>
        <h3 className={`text-xs font-bold ${theme.title}`}>{t('systemRuleSources.section.overlapReserved')}</h3>
        <p className={`mt-2 text-[11px] leading-relaxed ${theme.muted}`}>{t('systemRuleSources.overlapNote')}</p>
      </div>
    </div>
  );
}
