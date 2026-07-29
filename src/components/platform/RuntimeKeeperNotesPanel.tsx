import { useState } from 'react';

/**
 * CoC Keeper notes for the authenticated Room Runtime host.
 *
 * The panel owns only presentation. Its caller writes a server-authoritative
 * `hostOnly` RuntimeLog event and supplies the host-projected result. It never
 * treats hidden React UI as the privacy boundary.
 */

export interface RuntimeKeeperNoteItem {
  id: string;
  title?: string;
  body: string;
  createdAt?: string;
}

export interface RuntimeKeeperNotesPanelProps {
  items: RuntimeKeeperNoteItem[];
  canRecord: boolean;
  onRecord?: (input: { title?: string; body: string }) => Promise<void> | void;
  onRefresh?: () => void;
  loading?: boolean;
  feedError?: string | null;
  contextHint?: string | null;
}

function formatTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
}

export function RuntimeKeeperNotesPanel({
  items,
  canRecord,
  onRecord,
  onRefresh,
  loading,
  feedError,
  contextHint,
}: RuntimeKeeperNotesPanelProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  const canSubmit = canRecord && body.trim().length > 0 && !recording && !!onRecord;
  const record = async () => {
    if (!canSubmit || !onRecord) return;
    setRecording(true);
    setRecordError(null);
    try {
      await onRecord({ title: title.trim() || undefined, body: body.trim() });
      setTitle('');
      setBody('');
    } catch (error) {
      setRecordError(error instanceof Error ? error.message : String(error));
    } finally {
      setRecording(false);
    }
  };

  const input = 'w-full rounded border border-slate-400/40 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-violet-500/60';

  return (
    <div className="space-y-2 text-left">
      <div className="rounded border border-violet-300/60 bg-violet-50/70 p-2">
        <div className="text-[11px] font-bold text-violet-950">Keeper 笔记</div>
        <p className="mt-0.5 text-[10px] leading-relaxed text-violet-800">仅当前主持人可读取；不会显示给调查员或旁观者。</p>
        <input
          className={`${input} mt-1.5`}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="标题（可选），例如：真相 / 伏笔 / 线索去向"
          disabled={recording || !canRecord}
        />
        <textarea
          className={`${input} mt-1.5 min-h-[64px] resize-y`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="只给 Keeper 自己看的会话笔记…"
          disabled={recording || !canRecord}
        />
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void record()}
            disabled={!canSubmit}
            className="rounded border border-violet-700/50 bg-violet-700/15 px-2.5 py-1 text-[11px] font-bold text-violet-950 disabled:opacity-40"
          >
            {recording ? '记录中…' : '保存 Keeper 笔记'}
          </button>
        </div>
        {recordError && <div className="mt-1 text-[10px] font-bold text-red-700">保存失败：{recordError}</div>}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-600">本场 Keeper 笔记（{items.length}）</span>
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
      {items.length === 0 ? (
        <div className="rounded border border-dashed border-violet-300/60 bg-white/40 p-3 text-center text-[11px] text-slate-500">
          还没有 Keeper 笔记。公开给调查员的内容请使用「公开线索」。
        </div>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto">
          {[...items].reverse().map((item) => (
            <div key={item.id} className="rounded border border-violet-200/70 bg-white/80 px-2 py-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[12px] font-bold text-slate-800">{item.title || 'Keeper 笔记'}</span>
                {item.createdAt && <span className="ml-auto text-[9px] text-slate-400">{formatTime(item.createdAt)}</span>}
              </div>
              <div className="mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-slate-700">{item.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
