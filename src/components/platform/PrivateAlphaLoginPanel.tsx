import { FormEvent, useState } from 'react';

import { createTranslator, type Locale } from '../../i18n';

type Props = {
  locale: Locale;
  loading?: boolean;
  error?: string | null;
  onSubmit(input: { displayName: string; accessCode: string }): Promise<void> | void;
  onToggleLocale(): void;
};

/** Minimal cloud-private-alpha sign-in. Access codes never persist in browser storage. */
export function PrivateAlphaLoginPanel({ locale, loading = false, error, onSubmit, onToggleLocale }: Props) {
  const { t } = createTranslator(locale);
  const [displayName, setDisplayName] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ displayName, accessCode });
    setAccessCode('');
  };

  return (
    <div className="min-h-screen bg-[#17130f] text-[#f7f3ea]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 md:px-8">
        <header className="flex items-center justify-between">
          <div className="text-sm font-bold">{t('shell.brand')}</div>
          <button type="button" onClick={onToggleLocale} className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/10">
            {locale === 'en' ? '中文' : 'English'}
          </button>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 items-center py-10">
          <section className="w-full rounded-xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest text-[#f5c518]">{t('privateAlphaAuth.eyebrow')}</div>
            <h1 className="mt-2 text-3xl font-black">{t('privateAlphaAuth.title')}</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">{t('privateAlphaAuth.subtitle')}</p>
            <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
              <label className="block text-sm font-bold" htmlFor="private-alpha-display-name">
                {t('privateAlphaAuth.displayName')}
                <input
                  id="private-alpha-display-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="nickname"
                  className="mt-2 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm text-[#17130f] outline-none focus:border-[#f5c518]"
                />
              </label>
              <label className="block text-sm font-bold" htmlFor="private-alpha-access-code">
                {t('privateAlphaAuth.accessCode')}
                <input
                  id="private-alpha-access-code"
                  type="password"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-2 w-full rounded-md border border-white/15 bg-white px-3 py-2.5 text-sm text-[#17130f] outline-none focus:border-[#f5c518]"
                />
              </label>
              {error && <p className="text-sm leading-5 text-[#ffb4a6]" role="status">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-md bg-[#f5c518] px-4 py-2.5 text-sm font-bold text-[#17130f] transition hover:bg-[#f5c518]/90 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? t('privateAlphaAuth.signingIn') : t('privateAlphaAuth.signIn')}
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-white/55">{t('privateAlphaAuth.notice')}</p>
          </section>
        </main>
      </div>
    </div>
  );
}
