import type { RuntimeLogEntry } from '../../lib/runtime-log-types';
import { COC_KIND_LABELS, cocLogColor } from './CocGameplayShared';
import { CocDiceTrayPanel } from './CocDiceTrayPanel';

type CocRollConsolePanelProps = {
  combatLog: RuntimeLogEntry[];
  diceTray: Record<string, number>;
  onAddDie: (die: string) => void;
  onClearDice: () => void;
  onRollDice: () => void;
};

export function CocRollConsolePanel({
  combatLog,
  diceTray,
  onAddDie,
  onClearDice,
  onRollDice,
}: CocRollConsolePanelProps) {
  const latest = combatLog[0];

  return (
    <div className="border border-[#2f7f68]/35 bg-[#101413] p-4 flex flex-col min-h-[420px]">
      <h3 className="text-[#8fb7aa] font-bold uppercase mb-3 border-b border-[#2f7f68]/30 pb-1">
        掷骰日志 <span className="text-[10px] tracking-widest text-[#8fb7aa]/65 ml-2">ROLL CONSOLE</span>
      </h3>

      <div className="mb-3 border border-[#2f7f68]/55 bg-[#2f7f68]/10 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#8fb7aa] mb-1">
              最新结果 <span className="text-[#8fb7aa]/60">LATEST RESULT</span>
            </div>
            <div className="text-sm font-bold text-[#d4d4d8]">{latest?.title ?? '暂无结果'}</div>
            <div className="text-[11px] text-[#8fb7aa]">{latest ? COC_KIND_LABELS[latest.kind] : '等待检定或掷骰'}</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black font-mono leading-none text-[#5aa58f]">
              {latest?.displayValue ?? '--'}
            </div>
            {latest?.outcome && (
              <div className="mt-1 text-[11px] font-bold text-[#d4d4d8]">{latest.outcome}</div>
            )}
          </div>
        </div>
        {(latest?.calculation || latest?.detail || latest?.summary) && (
          <div className="mt-2 text-xs text-[#d4d4d8] leading-relaxed">
            {latest.calculation ?? latest.detail ?? latest.summary}
          </div>
        )}
        {latest?.tags && latest.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {latest.tags.slice(0, 5).map(tag => (
              <span key={tag} className="border border-[#2f7f68]/30 bg-black/30 px-1.5 py-0.5 text-[10px] text-[#8fb7aa]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 font-mono text-xs overflow-y-auto custom-scrollbar mb-4 bg-black/40 p-2 border border-[#2f7f68]/15">
        {combatLog.map(entry => (
          <div key={entry.id} className={`border-b border-[#2f7f68]/12 py-2 last:border-0 ${cocLogColor(entry)}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">{entry.title}</span>
              <span className="text-[10px] text-[#8fb7aa]">{COC_KIND_LABELS[entry.kind]}</span>
            </div>
            <div className="mt-1 text-[#d4d4d8]">{entry.summary}</div>
            {(entry.calculation || entry.detail) && (
              <div className="mt-1 text-[11px] text-[#8fb7aa]">{entry.calculation ?? entry.detail}</div>
            )}
          </div>
        ))}
      </div>

      <CocDiceTrayPanel
        diceTray={diceTray}
        onAddDie={onAddDie}
        onClearDice={onClearDice}
        onRollDice={onRollDice}
      />
    </div>
  );
}
