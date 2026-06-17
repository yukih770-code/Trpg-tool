/**
 * Workshop page (platform-level).
 * AI-LANDMARK: PLATFORM_WORKSHOP_SYSTEM_RULE_SOURCES_SHELL_V1
 *
 * Thin page wrapper around WorkshopShell. Discovery / subscription scaffold only.
 * Nav space — no in-page back/home (Navigation & Exit Contract): the global nav
 * provides Home.
 */
import { createTranslator, type Locale } from '../i18n';
import { WorkshopShell } from '../components/platform/WorkshopShell';

export type WorkshopProps = {
  locale: Locale;
};

export function Workshop({ locale }: WorkshopProps) {
  const { t } = createTranslator(locale);

  return (
    <div className="min-h-screen">
      <WorkshopShell t={t} locale={locale} />
    </div>
  );
}
