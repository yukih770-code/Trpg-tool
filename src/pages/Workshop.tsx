/**
 * Workshop page (platform-level).
 * AI-LANDMARK: PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1
 *
 * Thin page wrapper around WorkshopShell. Discovery / subscription scaffold only.
 */
import { createTranslator, type Locale } from '../i18n';
import { WorkshopShell } from '../components/platform/WorkshopShell';

export type WorkshopProps = {
  locale: Locale;
  onBackHome: () => void;
};

export function Workshop({ locale, onBackHome }: WorkshopProps) {
  const { t } = createTranslator(locale);

  return (
    <div className="min-h-screen">
      <WorkshopShell t={t} locale={locale} />
      <div className="mx-auto w-full max-w-5xl px-4 pb-8 md:px-8">
        <button
          type="button"
          onClick={onBackHome}
          className="rounded-md border border-[#2f2a22]/20 bg-white px-3 py-1.5 text-sm font-bold text-[#17130f] transition hover:bg-[#2f2a22]/8"
        >
          {t('shell.backHome')}
        </button>
      </div>
    </div>
  );
}
