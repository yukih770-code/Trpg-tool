import {
  type ApiServiceFailureKind,
  isFrontendDevelopment,
  resolveConfiguredDevViewerUserId,
} from '../../lib/api/apiClient';
import { createTranslator, type Locale } from '../../i18n';

type Props = {
  locale: Locale;
  failureKind?: ApiServiceFailureKind | null;
};

function failureMessageKey(failureKind: ApiServiceFailureKind): string {
  switch (failureKind) {
    case 'invalid_dev_identity': return 'localDevIdentity.missingFixture';
    case 'backend_unreachable': return 'localDevIdentity.backendUnreachable';
    case 'service_unavailable': return 'localDevIdentity.worldServiceUnavailable';
    case 'access_denied': return 'localDevIdentity.accessDenied';
    case 'not_found': return 'localDevIdentity.notFound';
    case 'request_failed': return 'localDevIdentity.requestFailed';
  }
}

export function LocalDevIdentitySwitcher({ locale, failureKind }: Props) {
  const { t } = createTranslator(locale);
  const configuredUserId = resolveConfiguredDevViewerUserId();

  if (!isFrontendDevelopment()) return null;

  return (
    <div className="rounded-xl border border-dashed border-[#2f2a22]/20 bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">{t('localDevIdentity.title')}</h2>
          <p className="mt-1 text-xs text-[#51483d]">{t('localDevIdentity.notice')}</p>
          <p className="mt-1 text-xs text-[#51483d]">{t('localDevIdentity.apiUsesCurrentUser')}</p>
        </div>
        <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1 text-[11px] font-bold text-[#51483d]">DEV</span>
      </div>
      {configuredUserId ? (
        <div className="mt-3 inline-flex items-center rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d]">
          {t('localDevIdentity.userA')}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#8b3a2f]">{t('localDevIdentity.missingConfiguration')}</p>
      )}
      {failureKind && (
        <p className="mt-3 text-sm leading-6 text-[#8b3a2f]" role="status">
          {t(failureMessageKey(failureKind))}
        </p>
      )}
    </div>
  );
}
