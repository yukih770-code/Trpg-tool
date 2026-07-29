import { useState } from 'react';

import {
  INVENTORY_ACTION_LABELS,
  INVENTORY_CHANGE_KIND_OPTIONS,
  type InventoryChangeKind,
} from './runtimeInventoryBoundary';

/**
 * RuntimeManualStateLogPanel (M29 / M56) — shared Manual State Log v0 panel.
 *
 * AI-LANDMARK: RUNTIME_MANUAL_STATE_LOG_PANEL_V0
 *
 * Host records a state change as a LOG LINE (e.g. "阿尔文 HP -5", "获得线索：
 * 血迹通向仓库"). This is a manual record only — it NEVER touches character
 * sheets / actor stores and does no rules math. Authority is injected via
 * `onRecord`: local shell writes the local RuntimeLog; room bridge calls the
 * server append endpoint. This panel deliberately records public table state;
 * private host records use a separate server-projected surface.
 */

export interface RuntimeStateLogItem {
  id: string;
  targetName?: string;
  body: string;
  createdAt?: string;
  /** M56 optional change classification (display only). */
  changeKind?: string;
  itemLabel?: string;
  actionLabel?: string;
}

export interface RuntimeManualStateLogRecordInput {
  targetName?: string;
  body: string;
  changeKind?: InventoryChangeKind;
  itemLabel?: string;
  actionLabel?: string;
}

export interface RuntimeManualStateLogPanelProps {
  /** Whether the current user may record (host only). */
  canEdit: boolean;
  items: RuntimeStateLogItem[];
  onRecord?: (input: RuntimeManualStateLogRecordInput) => Promise<void> | void;
  onRefresh?: () => void;
  loading?: boolean;
  feedError?: string | null;
  /** Brief live-sync perception: shows a "刚刚更新" chip (M33). */
  justUpdated?: boolean;
  /** Extra context line, e.g. offline hint (M37, mirrors public-info panel). */
  contextHint?: string | null;
  /** Optional actor/target name suggestions from the roster (M52). Read-only aid;
   * picking one only fills the free-text target — it never touches a character. */
  candidateTargets?: string[];
}

function formatTime(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString();
}

export function RuntimeManualStateLogPanel({
  canEdit,
  items,
  onRecord,
  onRefresh,
  loading,
  feedError,
  justUpdated,
  contextHint,
  candidateTargets,
}: RuntimeManualStateLogPanelProps) {
  const [targetName, setTargetName] = useState('');
  const [body, setBody] = useState('');
  const [changeKind, setChangeKind] = useState<InventoryChangeKind>('condition');
  const [itemLabel, setItemLabel] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Item / action fields only apply to物品 / 装备变化 (M56).
  const showItemFields = changeKind === 'inventory' || changeKind === 'equipment';
  const canSubmit = canEdit && body.trim().length > 0 && !saving && !!onRecord;

  const record = async () => {
    if (!canSubmit || !onRecord) return;
    setSaving(true);
    setSaveError(null);
    setJustSaved(false);
    try {
      await onRecord({
        targetName: targetName.trim() || undefined,
        body: body.trim(),
        changeKind,
        itemLabel: showItemFields ? itemLabel.trim() || undefined : undefined,
        actionLabel: showItemFields ? actionLabel || undefined : undefined,
      });
      setBody('');
      setItemLabel('');
      setJustSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded border border-slate-400/40 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-emerald-500/60';
  const newestFirst = [...items].reverse();

  return (
    <div className="space-y-2 text-left">
      {canEdit && (
        <div className="rounded border border-slate-300/60 bg-white/70 p-2">
          <div className="text-[11px] font-bold text-slate-700">记录状态变化</div>
          <p className="mt-0.5 text-[10px] text-amber-700">这是手动记录，不会自动修改角色卡数值。</p>
          <input
            className={`${input} mt-1.5`}
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            placeholder="对象 / 角色名（可选），例如：阿尔文"
            disabled={saving}
            list={candidateTargets && candidateTargets.length > 0 ? 'runtime-state-log-targets' : undefined}
          />
          {candidateTargets && candidateTargets.length > 0 && (
            <datalist id="runtime-state-log-targets">
              {candidateTargets.map((t) => <option key={t} value={t} />)}
            </datalist>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-500">变化类型</span>
            <select
              className={`${input} w-auto`}
              value={changeKind}
              onChange={(e) => setChangeKind(e.target.value as InventoryChangeKind)}
              disabled={saving}
            >
              {INVENTORY_CHANGE_KIND_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>
          {showItemFields && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <select
                className={`${input} w-auto`}
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                disabled={saving}
              >
                <option value="">动作（可选）</option>
                {INVENTORY_ACTION_LABELS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input
                className={`${input} flex-1`}
                value={itemLabel}
                onChange={(e) => setItemLabel(e.target.value)}
                placeholder="物品名（可选），例如：长剑 / 治疗药水"
                disabled={saving}
              />
            </div>
          )}
          <textarea
            className={`${input} mt-1.5 min-h-[52px] resize-y`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="变化说明，例如：HP -5 / SAN -1 / 获得线索：血迹通向仓库"
            disabled={saving}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void record()}
              disabled={!canSubmit}
              className="rounded border border-emerald-600/50 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-800 disabled:opacity-40"
            >
              {saving ? '记录中…' : '记入日志'}
            </button>
            {justSaved && !saveError && <span className="text-[10px] font-bold text-emerald-700">已记录 ✓</span>}
          </div>
          {saveError && <div className="mt-1 text-[10px] font-bold text-red-700">记录失败：{saveError}</div>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
          状态记录（{items.length}）
          {justUpdated && (
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">刚刚更新</span>
          )}
        </span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded border border-slate-400/50 bg-white/70 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 disabled:opacity-40"
          >
            {loading ? '刷新中…' : '刷新'}
          </button>
        )}
      </div>
      {contextHint && <div className="text-[10px] text-amber-700">{contextHint}</div>}
      {feedError && <div className="text-[10px] font-bold text-red-700">加载失败：{feedError}</div>}

      {newestFirst.length === 0 ? (
        <div className="rounded border border-dashed border-slate-400/40 bg-white/40 p-3 text-center text-[11px] text-slate-500">
          {canEdit ? '还没有状态记录。战斗伤害、线索获得、重要变化都可以随手记一条。' : '还没有公开的状态记录。'}
        </div>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto">
          {newestFirst.map((item) => (
            <div key={item.id} className="rounded border border-slate-300/50 bg-white/80 px-2 py-1.5">
              <div className="flex flex-wrap items-baseline gap-2 text-[12px]">
                {item.targetName && <span className="font-bold text-slate-800">{item.targetName}</span>}
                {(item.actionLabel || item.itemLabel) && (
                  <span className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700">
                    {[item.actionLabel, item.itemLabel].filter(Boolean).join(' ')}
                  </span>
                )}
                <span className="whitespace-pre-wrap leading-relaxed text-slate-700">{item.body}</span>
                <span className="ml-auto text-[9px] text-slate-400">{formatTime(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
