/**
 * LinkableEntityCard
 * AI-LANDMARK: LINKABLE_ENTITY_FAN_PLAZA_SCAFFOLD_V1
 *
 * Compact card for a linkable entity (actor / campaign / map / etc.).
 * Shows type, title, summary, visibility, share code, public path label, and
 * interface-reserved buttons. No real copy-link / open / permission logic.
 */
import { ENTITY_TYPE_I18N_KEY, type EntitySummary } from '../../lib/architecture/entityGraph';

export type LinkableEntityCardProps = {
  entity: EntitySummary;
  t: (key: string) => string;
  relationKindLabel?: string;
  onView?: (id: string) => void;
};

export function LinkableEntityCard({ entity, t, relationKindLabel, onView }: LinkableEntityCardProps) {
  return (
    <div className="rounded-md border border-[#2f2a22]/15 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-[#2f2a22]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#51483d]">
          {t(`fanPlaza.entityType.${ENTITY_TYPE_I18N_KEY[entity.type]}`)}
        </span>
        {relationKindLabel && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a5a4a]">{relationKindLabel}</span>
        )}
        <span className="border border-[#2f2a22]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#51483d]/70">
          {t('fanPlaza.visibilityLabel')}：{t(`fanPlaza.visibility.${entity.visibility}`)}
        </span>
      </div>
      <div className="mt-1.5 text-sm font-bold text-[#17130f]">{entity.title}</div>
      {entity.subtitle && <div className="text-[11px] text-[#51483d]">{entity.subtitle}</div>}
      <p className="mt-1 text-xs text-[#51483d]">{entity.summary}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-[#51483d]/80">
        <span><span className="font-bold">{t('fanPlaza.shareCode')}：</span>{entity.shareCode}</span>
        <span><span className="font-bold">{t('fanPlaza.publicPath')}：</span>{entity.publicPathLabel}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onView?.(entity.id)}
          className="border border-[#2f2a22]/20 px-2.5 py-1 text-[11px] font-bold text-[#51483d] hover:border-[#17130f]"
        >
          {t('fanPlaza.actions.viewEntity')}
        </button>
        <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">
          {t('fanPlaza.actions.openDetailReserved')}
        </button>
        <button type="button" className="border border-dashed border-[#2f2a22]/30 px-2.5 py-1 text-[11px] font-bold text-[#51483d]/60">
          {t('fanPlaza.actions.copyLinkReserved')}
        </button>
      </div>
    </div>
  );
}
