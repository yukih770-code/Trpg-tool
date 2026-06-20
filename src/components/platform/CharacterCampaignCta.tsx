import { createContext, useContext, type ReactNode } from 'react';
import { createTranslator, readStoredLocale } from '../../i18n';

export type CharacterCampaignCtaTone = 'dnd' | 'coc' | 'cp';

export type CharacterCampaignCtaContextValue = {
  tone: CharacterCampaignCtaTone;
  actorName?: string;
  currentCampaignLabel?: string | null;
  contextCampaignLabel?: string | null;
  onSelectCampaign?: () => void;
  onReturnToCampaignEntry?: () => void;
  onEnterEntryPreparation?: () => void;
};

export type CharacterCampaignCtaProps = CharacterCampaignCtaContextValue & {
  className?: string;
};

const CharacterCampaignCtaContext = createContext<CharacterCampaignCtaContextValue | null>(null);

export function CharacterCampaignCtaProvider({
  value,
  children,
}: {
  value: CharacterCampaignCtaContextValue;
  children: ReactNode;
}) {
  return (
    <CharacterCampaignCtaContext.Provider value={value}>
      {children}
    </CharacterCampaignCtaContext.Provider>
  );
}

export function useCharacterCampaignCta() {
  return useContext(CharacterCampaignCtaContext);
}

const toneClasses: Record<CharacterCampaignCtaTone, {
  card: string;
  eyebrow: string;
  title: string;
  button: string;
  muted: string;
}> = {
  dnd: {
    card: 'border-[#58180d]/35 bg-[#fff8e6]/70 text-[#2c1810]',
    eyebrow: 'text-[#58180d]/65',
    title: 'text-[#58180d]',
    button: 'border-[#58180d] bg-[#58180d] text-[#fdf6e3] hover:bg-[#2c1810]',
    muted: 'text-[#58180d]/65',
  },
  coc: {
    card: 'border-[#2f7f68]/35 bg-black/10 text-[#d4d4d8]',
    eyebrow: 'text-[#8fb7aa]',
    title: 'text-[#5aa58f]',
    button: 'border-[#2f7f68] bg-[#2f7f68] text-[#06100d] hover:bg-[#8fb7aa]',
    muted: 'text-[#8fb7aa]/75',
  },
  cp: {
    card: 'border-[#d8b954]/35 bg-black/20 text-[#d4d4d8]',
    eyebrow: 'text-[#d8b954]/80',
    title: 'text-[#f5c518]',
    button: 'border-[#f5c518] bg-[#f5c518] text-[#0d0d0d] hover:bg-[#d8b954]',
    muted: 'text-[#d8b954]/70',
  },
};

export function CharacterCampaignCta({
  tone,
  actorName,
  currentCampaignLabel,
  contextCampaignLabel,
  onSelectCampaign,
  onReturnToCampaignEntry,
  onEnterEntryPreparation,
  className = '',
}: CharacterCampaignCtaProps) {
  const locale = readStoredLocale();
  const { t } = createTranslator(locale);
  const theme = toneClasses[tone];
  const separator = locale === 'zh-CN' ? '：' : ': ';
  const sentenceEnd = locale === 'zh-CN' ? '。' : '. ';
  const campaignLabel = contextCampaignLabel || currentCampaignLabel || t('multiWorkspace.characterCampaignCta.noCampaign');
  const action = contextCampaignLabel
    ? onReturnToCampaignEntry
    : currentCampaignLabel
      ? onEnterEntryPreparation
      : onSelectCampaign;
  const actionLabel = contextCampaignLabel
    ? t('multiWorkspace.characterCampaignCta.returnToCampaignEntry')
    : currentCampaignLabel
      ? t('multiWorkspace.characterCampaignCta.enterEntryPreparation')
      : t('multiWorkspace.characterCampaignCta.selectCampaign');

  if (!action) return null;

  return (
    <section className={`rounded-lg border p-3 ${theme.card} ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.eyebrow}`}>
            {t('multiWorkspace.characterCampaignCta.eyebrow')}
          </div>
          <div className={`mt-1 text-sm font-bold ${theme.title}`}>
            {contextCampaignLabel
              ? `${t('multiWorkspace.characterCampaignCta.currentContext')}${separator}${campaignLabel}`
              : `${t('multiWorkspace.characterCampaignCta.currentCampaign')}${separator}${campaignLabel}`}
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${theme.muted}`}>
            {actorName ? `${t('multiWorkspace.characterCampaignCta.actorLabel')}${separator}${actorName}${sentenceEnd}` : ''}
            {t('multiWorkspace.characterCampaignCta.shellOnlyNote')}
          </p>
        </div>
        <button
          type="button"
          onClick={action}
          className={`shrink-0 rounded-md border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${theme.button}`}
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}
