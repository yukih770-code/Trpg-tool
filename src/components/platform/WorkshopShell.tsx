/**
 * Workshop discovery, joined-content, and private-authoring entry.
 *
 * Catalog and joined records come only from the repository. An empty repository
 * renders a truthful empty state; this shell never manufactures community work.
 * Subscription/install/publish behavior remains unavailable until its service
 * and persistence chain exists.
 */
import { useEffect, useState } from 'react';
import type { Locale } from '../../i18n';
import { platformRepo } from '../../lib/architecture/repositoryComposition';
import { localized, type WorkshopBrowseItem } from '../../lib/platform/workshopTypes';
import { DndPersonalSpeciesPackPanel } from './DndPersonalSpeciesPackPanel';
import { WorkshopItemDetail } from './WorkshopItemDetail';

export type WorkshopTab = 'browse' | 'subscriptions' | 'myContent';

export type WorkshopShellProps = {
  t: (key: string) => string;
  locale: Locale;
  initialTab?: WorkshopTab;
  onReturnToCreator?: () => void;
};

function EmptyState({
  title,
  note,
  actionLabel,
  onAction,
}: {
  title: string;
  note: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <section className="rounded-xl border border-[#2f2a22]/15 bg-[#faf8f2] px-5 py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#17130f] text-lg text-white" aria-hidden="true">
        ◇
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#17130f]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#51483d]/75">{note}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-md bg-[#17130f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2f2a22]"
      >
        {actionLabel}
      </button>
    </section>
  );
}

function BrowseCard({
  item,
  locale,
  t,
  onOpen,
}: {
  key?: string;
  item: WorkshopBrowseItem;
  locale: Locale;
  t: (key: string) => string;
  onOpen: () => void;
}) {
  return (
    <article className="flex flex-col rounded-lg border border-[#2f2a22]/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-[#17130f]">{localized(item.title, locale)}</h2>
          <p className="mt-1 text-xs text-[#51483d]/60">{item.author}</p>
        </div>
        <span className="rounded border border-[#2f2a22]/15 px-2 py-0.5 text-[10px] font-bold text-[#51483d]">
          {t(`workshop.category.${item.category}`)}
        </span>
      </div>
      <p className="mt-3 flex-1 text-sm leading-6 text-[#51483d]/80">
        {localized(item.description, locale)}
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 self-start rounded-md bg-[#17130f] px-3 py-1.5 text-xs font-bold text-white"
      >
        {t('workshop.card.viewDetails')}
      </button>
    </article>
  );
}

export function WorkshopShell({ t, locale, initialTab = 'browse', onReturnToCreator }: WorkshopShellProps) {
  const [tab, setTab] = useState<WorkshopTab>(initialTab);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
    setDetailId(null);
  }, [initialTab]);

  const browseItems = platformRepo.workshopPackages.list();
  const subscriptionItems = platformRepo.workshopPackages.listSubscriptions();
  const detailItem = detailId ? browseItems.find((item) => item.id === detailId) : undefined;

  if (detailItem) {
    return (
      <WorkshopItemDetail
        item={detailItem}
        t={t}
        locale={locale}
        onBack={() => setDetailId(null)}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      {onReturnToCreator && (
        <div className="mb-5 flex items-center gap-3 rounded-md border border-[#2f2a22]/12 bg-[#faf8f2] px-3 py-2">
          <button
            type="button"
            onClick={onReturnToCreator}
            aria-label={t('workshop.myContent.returnToBuilder')}
            title={t('workshop.myContent.returnToBuilder')}
            className="flex h-8 w-8 items-center justify-center rounded border border-[#2f2a22]/20 text-lg text-[#17130f]"
          >
            ←
          </button>
          <span className="text-sm font-bold text-[#51483d]">{t('workshop.myContent.builderContext')}</span>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-bold text-[#17130f]">{t('workshop.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#51483d]">{t('workshop.subtitle')}</p>
      </header>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-[#2f2a22]/12 pb-2">
        {(['browse', 'subscriptions', 'myContent'] as WorkshopTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-3 py-1.5 text-sm font-bold transition ${
              tab === key ? 'bg-[#17130f] text-white' : 'text-[#51483d] hover:bg-[#2f2a22]/8'
            }`}
          >
            {t(`workshop.tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="mt-5">
          {browseItems.length === 0 ? (
            <EmptyState
              title={t('workshop.empty.catalogTitle')}
              note={t('workshop.empty.catalogNote')}
              actionLabel={t('workshop.empty.openMyContent')}
              onAction={() => setTab('myContent')}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {browseItems.map((item) => (
                <BrowseCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  t={t}
                  onOpen={() => setDetailId(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'subscriptions' && (
        <div className="mt-5">
          {subscriptionItems.length === 0 ? (
            <EmptyState
              title={t('workshop.empty.libraryTitle')}
              note={t('workshop.empty.libraryNote')}
              actionLabel={t('workshop.empty.openMyContent')}
              onAction={() => setTab('myContent')}
            />
          ) : (
            <div className="space-y-3">
              {subscriptionItems.map((item) => (
                <article key={item.id} className="rounded-lg border border-[#2f2a22]/15 bg-white p-4 shadow-sm">
                  <h2 className="font-bold text-[#17130f]">{localized(item.title, locale)}</h2>
                  <p className="mt-1 text-xs text-[#51483d]/60">{item.author} · {item.version}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'myContent' && (
        <div className="mt-5 space-y-4">
          <section className="rounded-lg border border-[#a35b11]/25 bg-[#fff1c7]/45 p-5">
            <h2 className="text-xl font-bold text-[#58180d]">{t('workshop.myContent.title')}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#58180d]/75">{t('workshop.myContent.note')}</p>
          </section>
          <DndPersonalSpeciesPackPanel
            locale={locale}
            presentation="workbench"
            onCloseWorkbench={onReturnToCreator}
          />
        </div>
      )}
    </main>
  );
}
