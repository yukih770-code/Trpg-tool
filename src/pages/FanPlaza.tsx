/**
 * FanPlaza page (platform-level).
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Thin page wrapper around FanPlazaShell. Expressive sharing community,
 * separate from the Workshop. Scaffold only. Nav space — no in-page back/home
 * (Navigation & Exit Contract).
 */
import { createTranslator, type Locale } from '../i18n';
import { FanPlazaShell } from '../components/platform/FanPlazaShell';

export type FanPlazaProps = {
  locale: Locale;
};

export function FanPlaza({ locale }: FanPlazaProps) {
  const { t } = createTranslator(locale);
  return (
    <div className="min-h-screen">
      <FanPlazaShell t={t} locale={locale} />
    </div>
  );
}
