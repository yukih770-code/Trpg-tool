import { useState } from 'react';

import { RuntimeStaticMapPanel } from './RuntimeStaticMapPanel';

/**
 * RuntimeSceneFocusPanel (M42) — set / read the current scene focus.
 *
 * AI-LANDMARK: RUNTIME_SCENE_FOCUS_PANEL_V0
 *
 * The "current context layer" of Runtime Alpha — NOT a scene system. The host
 * sets a single CURRENT scene (title + short description + optional reference
 * image URL); players and spectators see it read-only. Authority is injected via
 * `onSet`: the room bridge writes it to the server RuntimeLog as a public
 * host.note with payload.noteKind = 'sceneFocus', so it live-syncs and restores
 * on refresh/rejoin from the memory room server. No scene list, no history, no
 * database, no map tokens/fog. System-agnostic.
 */

export interface RuntimeSceneFocus {
  title?: string;
  body?: string;
  mapUrl?: string;
  createdAt?: string;
}

export interface RuntimeSceneFocusPanelProps {
  /** Whether the current user may set the scene (host only). */
  canEdit: boolean;
  scene: RuntimeSceneFocus | null;
  onSet?: (input: { title?: string; body: string; mapUrl?: string }) => Promise<void> | void;
  loading?: boolean;
  feedError?: string | null;
  /** Extra context line, e.g. offline hint. */
  contextHint?: string | null;
  /** Brief live-sync perception chip. */
  justUpdated?: boolean;
}

function formatTime(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString();
}

export function RuntimeSceneFocusPanel({
  canEdit,
  scene,
  onSet,
  loading,
  feedError,
  contextHint,
  justUpdated,
}: RuntimeSceneFocusPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const canSubmit = canEdit && body.trim().length > 0 && !saving && !!onSet;

  const submit = async () => {
    if (!canSubmit || !onSet) return;
    setSaving(true);
    setSaveError(null);
    setJustSaved(false);
    try {
      await onSet({ title: title.trim() || undefined, body: body.trim(), mapUrl: mapUrl.trim() || undefined });
      setJustSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded border border-slate-400/40 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-emerald-500/60';
  const hasScene = !!scene && ((scene.title ?? '').trim() !== '' || (scene.body ?? '').trim() !== '' || (scene.mapUrl ?? '').trim() !== '');

  return (
    <div className="space-y-2 text-left">
      {/* Current scene (read-only for everyone; also shown to host above the form). */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-600">当前场景</span>
        {justUpdated && (
          <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">刚刚更新</span>
        )}
      </div>
      {contextHint && <div className="text-[10px] text-amber-700">{contextHint}</div>}
      {feedError && <div className="text-[10px] font-bold text-red-700">加载失败：{feedError}</div>}

      {hasScene && scene ? (
        <div className="rounded border border-emerald-500/30 bg-emerald-50/40 p-2.5">
          <div className="flex items-baseline gap-2">
            <span aria-hidden>📍</span>
            <span className="text-[13px] font-black text-slate-800">{scene.title?.trim() || '当前场景'}</span>
            {scene.createdAt && <span className="ml-auto text-[9px] text-slate-400">{formatTime(scene.createdAt)}</span>}
          </div>
          {scene.body && <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-slate-700">{scene.body}</p>}
          {scene.mapUrl && (
            <div className="mt-2">
              <RuntimeStaticMapPanel mapUrl={scene.mapUrl} isHost={canEdit} compact />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded border border-dashed border-slate-400/40 bg-white/40 p-3 text-center text-[11px] leading-relaxed text-slate-500">
          {loading
            ? '正在载入当前场景…'
            : canEdit
              ? '你还没有设置当前场景。设置后，玩家和旁观者会在这里看到当前发生的地点、氛围或目标。'
              : '主持人还没有设置当前场景。设置后，大家会在这里看到当前发生的地点、氛围或目标。'}
        </div>
      )}

      {/* Host editor. */}
      {canEdit && (
        <div className="rounded border border-slate-300/60 bg-white/70 p-2">
          <div className="text-[11px] font-bold text-slate-700">设置当前场景</div>
          <p className="mt-0.5 text-[10px] text-slate-500">会同步给所有玩家和旁观者，并记入日志。</p>
          <input
            className={`${input} mt-1.5`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="场景标题（可选），例如：破败的仓库 / 深夜的码头"
            disabled={saving}
          />
          <textarea
            className={`${input} mt-1.5 min-h-[56px] resize-y`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="简短描述当前的地点、氛围或目标…"
            disabled={saving}
          />
          <input
            className={`${input} mt-1.5`}
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="场景图 / 参考图链接（可选），https:// 开头的图片地址"
            disabled={saving}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              className="rounded border border-emerald-600/50 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-800 disabled:opacity-40"
            >
              {saving ? '设置中…' : '设为当前场景'}
            </button>
            {justSaved && !saveError && <span className="text-[10px] font-bold text-emerald-700">已同步给大家 ✓</span>}
          </div>
          {saveError && <div className="mt-1 text-[10px] font-bold text-red-700">设置失败：{saveError}</div>}
          <p className="mt-1 text-[10px] italic text-slate-400">这是当前场景的上下文，不是完整地图系统；场景图仅作参考展示。</p>
        </div>
      )}
    </div>
  );
}
