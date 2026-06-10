import type { RuntimeLogEntry } from '../../lib/runtime-log-types';
import { cpDisplayColor, cpEntryTone, cpKindLabel, SysHeader } from './CpGameplayShared';

export function CpRollConsolePanel({ entries }: { entries: RuntimeLogEntry[] }) {
  const latest = entries[0];

  return (
    <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4 space-y-4">
      <SysHeader>ROLL CONSOLE // 最新结果</SysHeader>
      {latest ? (
        <div className={`hud-panel p-4 flex gap-4 items-start transition-all ${cpEntryTone(latest)}`}>
          <div className="text-center shrink-0 min-w-[92px]">
            <div className="text-[9px] tracking-[0.2em] uppercase mb-0.5 text-[#00e5ff]/55">
              // {cpKindLabel(latest.kind)} //
            </div>
            <div className={`font-cp-title text-6xl leading-none break-all ${cpDisplayColor(latest)}`}>
              {latest.displayValue ?? '—'}
            </div>
            {latest.outcome && (
              <div className="text-[10px] text-[#9ab0c8]/65 mt-1">{latest.outcome}</div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] border border-[#00e5ff]/25 px-1.5 py-0.5 text-[#00e5ff]/70">
                {latest.kind}
              </span>
              <span className="text-xs font-bold text-[#f5c518] uppercase tracking-wide">{latest.title}</span>
            </div>
            <div className="text-[11px] text-[#d4d4d8] leading-relaxed whitespace-pre-wrap">{latest.summary}</div>
            {latest.detail && (
              <div className="text-[10px] text-[#9ab0c8]/75 leading-relaxed whitespace-pre-wrap">{latest.detail}</div>
            )}
            {latest.calculation && (
              <div className="text-[10px] text-[#00e5ff]/70 font-mono border border-[#00e5ff]/10 bg-[#050508] p-2 whitespace-pre-wrap">
                {latest.calculation}
              </div>
            )}
            {(latest.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {latest.tags?.map(tag => (
                  <span key={tag} className="text-[9px] border border-[#f5c518]/20 text-[#f5c518]/70 px-1.5 py-0.5 uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-[#00e5ff]/15 p-4 text-[#9ab0c8]/50 text-xs">等待首次掷骰结果。</div>
      )}

      <div>
        <div className="font-cp-title text-[9px] uppercase tracking-widest mb-2 text-[#00e5ff]/45">
          HISTORY // 历史日志
        </div>
        <div className="font-mono text-[10px] overflow-y-auto max-h-[260px] bg-[#050508] p-3 border border-[#00e5ff]/8 space-y-2"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 5px,rgba(0,229,255,0.008) 5px,rgba(0,229,255,0.008) 6px)' }}>
          {entries.map(entry => (
            <div key={entry.id} className="border-b border-[#00e5ff]/8 pb-2 last:border-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[#00e5ff]/45 uppercase">{cpKindLabel(entry.kind)}</span>
                <span className="text-[#f5c518]/85 font-bold">{entry.title}</span>
                {entry.displayValue !== undefined && (
                  <span className={`font-bold ${cpDisplayColor(entry)}`}>[{entry.displayValue}]</span>
                )}
                {entry.outcome && <span className="text-[#9ab0c8]/60">{entry.outcome}</span>}
              </div>
              <div className="text-[#d4d4d8]/85 whitespace-pre-wrap leading-relaxed">{entry.summary}</div>
              {entry.calculation && <div className="text-[#00e5ff]/45 mt-1 whitespace-pre-wrap">{entry.calculation}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
