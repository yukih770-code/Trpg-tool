import type { CampaignInstanceSummary } from '../../lib/platform/campaignFlow';
import { createTranslator, readStoredLocale } from '../../i18n';
import { useState } from 'react';

type CampaignLibraryTone = 'dnd' | 'coc' | 'cp';
type CampaignLibraryMode = 'home' | 'existing';

type CampaignLibraryShellProps = {
  systemId: string;
  systemName: string;
  tone: CampaignLibraryTone;
  mode?: 'library' | 'create';
  onAddCampaign?: () => void;
  panelClassName?: string;
};

const toneClasses: Record<CampaignLibraryTone, {
  card: string;
  accent: string;
  muted: string;
  primary: string;
  secondary: string;
  badge: string;
}> = {
  dnd: {
    card: 'border-[#58180d]/25 bg-white/55',
    accent: 'text-[#58180d]',
    muted: 'text-[#58180d]/70',
    primary: 'border-[#58180d] bg-[#58180d] text-[#fdf6e3]',
    secondary: 'border-[#58180d]/35 text-[#58180d]/55',
    badge: 'border-[#58180d]/30 text-[#58180d]/70',
  },
  coc: {
    card: 'border-[#2f7f68]/35 bg-[#101816]/85',
    accent: 'text-[#5aa58f]',
    muted: 'text-[#8fb7aa]/75',
    primary: 'border-[#2f7f68] bg-[#2f7f68] text-[#06100d]',
    secondary: 'border-[#2f7f68]/40 text-[#8fb7aa]/60',
    badge: 'border-[#2f7f68]/40 text-[#8fb7aa]/70',
  },
  cp: {
    card: 'border-[#d8b954]/35 bg-[#0d0d0d]/85',
    accent: 'text-[#f5c518]',
    muted: 'text-[#d8b954]/75',
    primary: 'border-[#f5c518] bg-[#f5c518] text-[#0d0d0d]',
    secondary: 'border-[#d8b954]/40 text-[#d8b954]/60',
    badge: 'border-[#d8b954]/40 text-[#d8b954]/70',
  },
};

// AI-LANDMARK: A11_SYSTEM_WORKSPACE_ENTRY_SHELL_V1
// Campaign Library placeholder: exposes CampaignInstance mental model only.
// No room creation, room-code generation, multiplayer, backend, actor binding,
// PackageLibrary UI, or Workshop Builder behavior is implemented here.
export function CampaignLibraryShell({
  systemId,
  systemName,
  tone,
  mode = 'library',
  onAddCampaign,
  panelClassName,
}: CampaignLibraryShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const [libraryMode, setLibraryMode] = useState<CampaignLibraryMode>('home');
  const theme = toneClasses[tone];
  const sampleCampaign: CampaignInstanceSummary = {
    campaignId: 'sample-grey-mist-a12f',
    systemId,
    title: t('campaignLibrary.sample.title'),
    roomCode: 'A12F',
    sourcePackageId: 'sample-grey-mist-package',
    lastPlayedAt: t('campaignLibrary.sample.lastPlayedAt'),
  };

  const createActions = [
    'campaignLibrary.create.standard',
    'campaignLibrary.create.quick',
    'campaignLibrary.create.importCampaign',
  ];
  const stats = [
    ['campaignLibrary.stats.total', '1'],
    ['campaignLibrary.stats.active', '1'],
    ['campaignLibrary.stats.hosted', '1'],
    ['campaignLibrary.stats.joined', '0'],
    ['campaignLibrary.stats.needsAttention', '0'],
    ['campaignLibrary.stats.recentPlayed', sampleCampaign.lastPlayedAt],
  ];

  return (
    <section className={panelClassName ?? 'rounded-lg border p-5'}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className={`text-xs font-bold uppercase tracking-[0.22em] ${theme.muted}`}>
            {t(mode === 'create' ? 'campaignLibrary.create.eyebrow' : 'campaignLibrary.eyebrow')}
          </div>
          <h2 className={`mt-2 text-2xl font-bold ${theme.accent}`}>
            {t(mode === 'create' ? 'campaignLibrary.create.title' : 'campaignLibrary.title')}
          </h2>
          <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${theme.muted}`}>
            {t(mode === 'create' ? 'campaignLibrary.create.subtitle' : 'campaignLibrary.subtitle')}
          </p>
        </div>
        <span className={`border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}>
          {systemName}
        </span>
      </div>

      {mode === 'create' && (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {createActions.map((key, index) => (
            <button
              key={key}
              type="button"
              disabled
              className={`min-h-28 cursor-default border p-4 text-left opacity-75 ${index === 0 ? theme.primary : theme.secondary}`}
            >
              <span className="block text-sm font-bold">{t(key)}</span>
              <span className="mt-2 block text-xs leading-relaxed opacity-75">
                {t('campaignLibrary.actions.placeholder')}
              </span>
            </button>
          ))}
        </div>
      )}

      {mode === 'library' && libraryMode === 'home' && (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setLibraryMode('existing')}
            className={`min-h-48 border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}
          >
            <h3 className={`text-lg font-bold ${theme.accent}`}>{t('campaignLibrary.title')}</h3>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
              {stats.map(([labelKey, value]) => (
                <div key={labelKey}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                    {t(labelKey)}
                  </div>
                  <div className="mt-1 break-words text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>
          </button>

          <button
            type="button"
            onClick={onAddCampaign}
            className={`min-h-48 border p-6 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme.card}`}
          >
            <h3 className={`text-lg font-bold ${theme.accent}`}>{t('campaignLibrary.actions.add')}</h3>
            <p className={`mt-3 text-sm leading-relaxed ${theme.muted}`}>
              {t('campaignLibrary.actions.addNote')}
            </p>
          </button>
        </div>
      )}

      {mode === 'library' && libraryMode === 'existing' && (
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <p className={`text-xs ${theme.muted}`}>
              {t('campaignLibrary.eyebrow')}
              <span className="mx-1.5 opacity-40">/</span>
              {t('campaignLibrary.existing.title')}
            </p>
            <h3 className={`mt-1 text-xl font-bold ${theme.accent}`}>
              {t('campaignLibrary.existing.title')}
            </h3>
            <p className={`mt-0.5 text-xs ${theme.muted}`}>
              {t('campaignLibrary.existing.subtitle')}
            </p>
          </div>

          <div className={`rounded-lg border p-4 ${theme.card}`}>
            <div className="flex flex-wrap gap-3">
              <input
                type="search"
                disabled
                placeholder={t('campaignLibrary.existing.searchPlaceholder')}
                className="min-w-0 flex-1 border bg-transparent px-3 py-1.5 text-sm opacity-60"
              />
              <select disabled className="border bg-transparent px-3 py-1.5 text-xs opacity-60">
                <option>{t('campaignLibrary.existing.sortRecent')}</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                'campaignLibrary.existing.filterAll',
                'campaignLibrary.existing.filterActive',
                'campaignLibrary.existing.filterNeedsAttention',
              ].map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled
                  className={`border px-3 py-1 text-[11px] font-bold uppercase tracking-wider opacity-65 ${theme.badge}`}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-lg border p-4 ${theme.card}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-wider ${theme.muted}`}>
                  {t('campaignLibrary.recent')}
                </div>
                <h3 className={`mt-1 text-xl font-bold ${theme.accent}`}>
                  {sampleCampaign.title} #{sampleCampaign.roomCode}
                </h3>
              </div>
              <span className={`border px-2 py-0.5 text-[10px] uppercase tracking-wider ${theme.badge}`}>
                {t('campaignLibrary.status.sample')}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
              {[
                [t('campaignLibrary.fields.system'), systemName],
                [t('campaignLibrary.fields.identity'), t('campaignLibrary.sample.identity')],
                [t('campaignLibrary.fields.sourcePackage'), t('campaignLibrary.sample.sourcePackage')],
                [t('campaignLibrary.fields.lastPlayed'), sampleCampaign.lastPlayedAt],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className={`font-bold uppercase tracking-wider ${theme.muted}`}>{label}</dt>
                  <dd className="mt-1 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {mode === 'library' && (
        <p className={`mt-5 border-t pt-4 text-xs leading-relaxed ${theme.muted}`}>
          {t('campaignLibrary.shortConcept')}
        </p>
      )}
    </section>
  );
}
