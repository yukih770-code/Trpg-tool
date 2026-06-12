import { useState } from 'react';
import {
  findCpCriticalInjuryDefinitionByName,
  getCpCriticalInjuryDefinitions,
  type CpCriticalInjuryDefinition,
  type CpCriticalInjuryLocation,
} from '../../lib/cp2024/critical-injuries';
import { SysHeader } from './CpGameplayShared';

/**
 * CpCriticalInjuryPanel
 *
 * AI-LANDMARK: CPRED_CRITICAL_INJURY_MANUAL_TRACKING
 *
 * Manual Critical Injury tracking (v1): the user picks a body/head injury
 * from the existing 2d6 tables and adds/removes it explicitly.
 * This panel does NOT roll injury tables, does not trigger from damage,
 * and does not automate armor, ammo, death saves, or treatment.
 */

type CpCriticalInjuryPanelProps = {
  injuries: string[];
  onAddInjury: (definition: CpCriticalInjuryDefinition) => void;
  onRemoveInjury: (injuryName: string, index: number) => void;
};

const LOCATION_LABELS: Record<CpCriticalInjuryLocation, string> = {
  body: '躯体 BODY',
  head: '头部 HEAD',
};

export function CpCriticalInjuryPanel({
  injuries,
  onAddInjury,
  onRemoveInjury,
}: CpCriticalInjuryPanelProps) {
  const [location, setLocation] = useState<CpCriticalInjuryLocation>('body');
  const options = getCpCriticalInjuryDefinitions(location);
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '');

  const handleLocationChange = (next: CpCriticalInjuryLocation) => {
    setLocation(next);
    setSelectedId(getCpCriticalInjuryDefinitions(next)[0]?.id ?? '');
  };

  const selected = options.find(def => def.id === selectedId) ?? options[0];

  return (
    <div className="cp-panel-cyan hud-panel-cyan hud-panel p-4">
      <SysHeader>CRITICAL INJURY // 重伤手动追踪</SysHeader>
      <p className="mb-2 text-[9px] text-[#9ab0c8]/45 font-mono uppercase tracking-wider">
        手动追踪 · 不自动判定伤害 · 是否触发由 GM 裁定
      </p>

      <div className="flex gap-1 mb-2">
        {(Object.keys(LOCATION_LABELS) as CpCriticalInjuryLocation[]).map(key => (
          <button
            key={key}
            type="button"
            aria-pressed={location === key}
            onClick={() => handleLocationChange(key)}
            className={`text-[10px] px-2 py-1 border font-mono uppercase transition-colors ${
              location === key
                ? 'border-[#f5c518] text-[#f5c518] bg-[#f5c518]/10'
                : 'border-[#00e5ff]/20 text-[#9ab0c8]/40 hover:border-[#00e5ff]/40'
            }`}
          >
            {LOCATION_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-1">
        <select
          value={selected?.id ?? ''}
          onChange={e => setSelectedId(e.target.value)}
          aria-label="选择重伤条目"
          className="flex-1 bg-[#080810] border border-[#00e5ff]/20 text-[#9ab0c8] text-xs p-2 font-mono outline-none focus:border-[#00e5ff]"
        >
          {options.map(def => (
            <option key={def.id} value={def.id}>
              [{def.roll}] {def.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected}
          onClick={() => selected && onAddInjury(selected)}
          className="px-3 bg-[#f5c518] text-[#080810] font-bold uppercase font-mono text-xs hover:bg-[#f5c518]/80 transition-colors disabled:opacity-40"
        >
          + 记录
        </button>
      </div>
      {selected && (
        <p className="mb-2 text-[9px] leading-relaxed text-[#9ab0c8]/55 font-mono">
          {selected.effectSummary}
          {selected.treatmentDV !== undefined && ` · 治疗 DV ${selected.treatmentDV}`}
        </p>
      )}

      <div className="border-t border-[#00e5ff]/15 pt-2">
        <div className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1.5">
          已记录 — {injuries.length} 处
        </div>
        {injuries.length === 0 ? (
          <p className="text-[10px] text-[#9ab0c8]/35 font-mono">暂无重伤记录</p>
        ) : (
          <div className="space-y-1.5">
            {injuries.map((injury, index) => {
              const def = findCpCriticalInjuryDefinitionByName(injury);
              return (
                <div key={`${injury}-${index}`} className="flex items-start gap-2 border border-orange-500/20 px-3 py-1.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-orange-300 text-[10px] leading-relaxed font-mono">{injury}</span>
                    {def && (
                      <span className="ml-2 text-[9px] text-[#9ab0c8]/40 font-mono uppercase">
                        {def.location === 'head' ? 'HEAD' : 'BODY'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveInjury(injury, index)}
                    className="text-[9px] border border-orange-500/30 text-orange-400 px-1.5 py-0.5 hover:bg-orange-900/30 shrink-0 uppercase font-mono"
                  >
                    移除
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
