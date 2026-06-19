import { createTranslator, readStoredLocale } from '../../i18n';

type SystemWorkspaceEntryTone = 'dnd' | 'coc' | 'cp';

type SystemWorkspaceEntryShellProps = {
  systemName: string;
  tone: SystemWorkspaceEntryTone;
  actorNoteKey: string;
  campaignNoteKey: string;
  onEnterActors: () => void;
  onEnterCampaigns: () => void;
};

const toneClasses: Record<SystemWorkspaceEntryTone, {
  wrapper: string;
  card: string;
  accent: string;
  muted: string;
  primary: string;
  secondary: string;
}> = {
  dnd: {
    wrapper: 'border-[#58180d]/30 bg-[#fff8e6]/80',
    card: 'border-[#58180d]/25 bg-white/55',
    accent: 'text-[#58180d]',
    muted: 'text-[#58180d]/70',
    primary: 'border-[#58180d] bg-[#58180d] text-[#fdf6e3] hover:bg-[#2c1810]',
    secondary: 'border-[#58180d]/50 text-[#58180d] hover:bg-[#58180d]/10',
  },
  coc: {
    wrapper: 'border-[#2f7f68]/65 bg-[#0f1413]/90',
    card: 'border-[#2f7f68]/35 bg-[#101816]/85',
    accent: 'text-[#5aa58f]',
    muted: 'text-[#8fb7aa]/75',
    primary: 'border-[#2f7f68] bg-[#2f7f68] text-[#06100d] hover:bg-[#8fb7aa]',
    secondary: 'border-[#2f7f68]/60 text-[#8fb7aa] hover:bg-[#2f7f68]/10',
  },
  cp: {
    wrapper: 'border-[#d8b954]/65 bg-[#0a0a0a]/90',
    card: 'border-[#d8b954]/35 bg-[#0d0d0d]/85',
    accent: 'text-[#f5c518]',
    muted: 'text-[#d8b954]/75',
    primary: 'border-[#f5c518] bg-[#f5c518] text-[#0d0d0d] hover:bg-[#d8b954]',
    secondary: 'border-[#d8b954]/60 text-[#d8b954] hover:bg-[#f5c518]/10',
  },
};

// AI-LANDMARK: A11_SYSTEM_WORKSPACE_ENTRY_SHELL_V1
// System workspace entry shell: two platform-level modules only — 角色 / 战役.
// Child entries stay grouped under their module. No import, write, campaign room,
// backend, package library, or rules runtime behavior is implemented here.
export function SystemWorkspaceEntryShell({
  systemName,
  tone,
  actorNoteKey,
  campaignNoteKey,
  onEnterActors,
  onEnterCampaigns,
}: SystemWorkspaceEntryShellProps) {
  const { t } = createTranslator(readStoredLocale());
  const theme = toneClasses[tone];

  return (
    <section className={`rounded-lg border p-5 shadow-sm ${theme.wrapper}`}>
      <div className="mb-5">
        <div className={`text-xs font-bold uppercase tracking-[0.22em] ${theme.muted}`}>
          {t('systemWorkspaceEntry.eyebrow')}
        </div>
        <h1 className={`mt-2 text-2xl font-bold ${theme.accent}`}>
          {systemName} {t('systemWorkspaceEntry.workspace')}
        </h1>
        <p className={`mt-2 max-w-3xl text-sm leading-relaxed ${theme.muted}`}>
          {t('systemWorkspaceEntry.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`rounded-lg border p-4 ${theme.card}`}>
          <h2 className={`text-xl font-bold ${theme.accent}`}>{t('systemWorkspaceEntry.actor.title')}</h2>
          <p className={`mt-2 min-h-10 text-sm leading-relaxed ${theme.muted}`}>{t(actorNoteKey)}</p>
          <button type="button" onClick={onEnterActors} className={`mt-4 w-full border px-4 py-2 text-sm font-bold ${theme.primary}`}>
            {t('systemWorkspaceEntry.actor.enter')}
          </button>
        </div>

        <div className={`rounded-lg border p-4 ${theme.card}`}>
          <h2 className={`text-xl font-bold ${theme.accent}`}>{t('systemWorkspaceEntry.campaign.title')}</h2>
          <p className={`mt-2 min-h-10 text-sm leading-relaxed ${theme.muted}`}>{t(campaignNoteKey)}</p>
          <button type="button" onClick={onEnterCampaigns} className={`mt-4 w-full border px-4 py-2 text-sm font-bold ${theme.primary}`}>
            {t('systemWorkspaceEntry.campaign.enter')}
          </button>
        </div>
      </div>
    </section>
  );
}
