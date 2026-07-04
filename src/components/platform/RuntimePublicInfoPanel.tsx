import { useState } from 'react';

/**
 * RuntimePublicInfoPanel (M29) — shared Public Info / Handout v0 panel.
 *
 * AI-LANDMARK: RUNTIME_PUBLIC_INFO_PANEL_V0
 *
 * One panel for local AND multiplayer Runtime, host AND player/spectator:
 * - Host (canPublish): title (optional) + body + publish, then the feed.
 * - Player / Spectator: read-only feed of published public info.
 *
 * The panel decides NO authority: `onPublish` is injected — the local shell
 * writes the local RuntimeLog; the room bridge calls the server append endpoint
 * (server-authoritative). This panel never imports server clients or stores.
 * Text-only v0: no images, attachments, markdown, editing, or recall.
 */

export interface RuntimePublicInfoItem {
  id: string;
  title?: string;
  body: string;
  createdAt?: string;
  authorLabel?: string;
}

export interface RuntimePublicInfoPanelProps {
  /** Whether the current user may publish (host only). */
  canPublish: boolean;
  items: RuntimePublicInfoItem[];
  onPublish?: (input: { title?: string; body: string }) => Promise<void> | void;
  onRefresh?: () => void;
  loading?: boolean;
  feedError?: string | null;
  /** Extra context line, e.g. offline hint. */
  contextHint?: string | null;
}

function formatTime(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString();
}

export function RuntimePublicInfoPanel({
  canPublish,
  items,
  onPublish,
  onRefresh,
  loading,
  feedError,
  contextHint,
}: RuntimePublicInfoPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);

  const canSubmit = canPublish && body.trim().length > 0 && !publishing && !!onPublish;

  const publish = async () => {
    if (!canSubmit || !onPublish) return;
    setPublishing(true);
    setPublishError(null);
    setJustPublished(false);
    try {
      await onPublish({ title: title.trim() || undefined, body: body.trim() });
      setTitle('');
      setBody('');
      setJustPublished(true);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : String(e));
    } finally {
      setPublishing(false);
    }
  };

  const input = 'w-full rounded border border-slate-400/40 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-emerald-500/60';
  const newestFirst = [...items].reverse();

  return (
    <div className="space-y-2 text-left">
      {canPublish && (
        <div className="rounded border border-slate-300/60 bg-white/70 p-2">
          <div className="text-[11px] font-bold text-slate-700">发布公开信息</div>
          <p className="mt-0.5 text-[10px] text-slate-500">所有玩家和旁观者都能看到，并会记入日志。</p>
          <input
            className={`${input} mt-1.5`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题（可选），例如：线索 / 场景描述 / 规则说明"
            disabled={publishing}
          />
          <textarea
            className={`${input} mt-1.5 min-h-[64px] resize-y`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="想让所有人看到的内容…"
            disabled={publishing}
          />
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void publish()}
              disabled={!canSubmit}
              className="rounded border border-emerald-600/50 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-800 disabled:opacity-40"
            >
              {publishing ? '发布中…' : '发布给所有人'}
            </button>
            {justPublished && !publishError && <span className="text-[10px] font-bold text-emerald-700">已发布 ✓</span>}
          </div>
          {publishError && <div className="mt-1 text-[10px] font-bold text-red-700">发布失败：{publishError}</div>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-600">已发布的公开信息（{items.length}）</span>
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
          {canPublish
            ? '还没有公开信息。发布第一条，让玩家知道当前的场景、线索或要点。'
            : '主持人还没有发布公开信息。发布后会显示在这里。'}
        </div>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto">
          {newestFirst.map((item) => (
            <div key={item.id} className="rounded border border-slate-300/50 bg-white/80 px-2 py-1.5">
              <div className="flex flex-wrap items-baseline gap-2">
                {item.title ? (
                  <span className="text-[12px] font-bold text-slate-800">{item.title}</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">公开信息</span>
                )}
                <span className="ml-auto text-[9px] text-slate-400">
                  {item.authorLabel ?? '主持人'}{item.createdAt ? ` · ${formatTime(item.createdAt)}` : ''}
                </span>
              </div>
              <div className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-slate-700">{item.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
