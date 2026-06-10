import { Button } from '../../../components/ui/button';
import type { CocRuntimeState } from '../../lib/coc-types';

type RuntimePools = {
  hp: { current: number; max: number };
  mp: { current: number; max: number };
  san: { current: number; max: number; initial?: number };
  luck: { current: number };
};

const flagItems = [
  { key: 'isMajorWound', label: '重伤', english: 'Major Wound' },
  { key: 'isDying', label: '濒死', english: 'Dying' },
  { key: 'isUnconscious', label: '昏迷', english: 'Unconscious' },
  { key: 'isTemporarilyInsane', label: '临时疯狂', english: 'Temporary Insanity' },
  { key: 'isIndefinitelyInsane', label: '不定疯狂', english: 'Indefinite Insanity' },
] as const;

type CocRuntimeStatePanelProps = {
  hasRuntime: boolean;
  runtimePools: RuntimePools;
  runtimeFlags: CocRuntimeState['flags'];
  luckMax: number;
  onInitializeRuntime: () => void;
  onRuntimeDelta: (label: string, delta: number, action: (delta: number) => void) => void;
  changeHp: (delta: number) => void;
  changeMp: (delta: number) => void;
  changeSan: (delta: number) => void;
  changeLuck: (delta: number) => void;
  onToggleFlag: (flag: typeof flagItems[number], active: boolean) => void;
  onSanQuickRoll: () => void;
};

export function CocRuntimeStatePanel({
  hasRuntime,
  runtimePools,
  runtimeFlags,
  luckMax,
  onInitializeRuntime,
  onRuntimeDelta,
  changeHp,
  changeMp,
  changeSan,
  changeLuck,
  onToggleFlag,
  onSanQuickRoll,
}: CocRuntimeStatePanelProps) {
  return (
    <div className="border border-[#2f7f68]/35 bg-[#101413] p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#2f7f68]/30 pb-1 mb-3">
        <h3 className="text-[#8fb7aa] font-bold uppercase">运行时状态 <span className="text-[10px] tracking-widest text-[#8fb7aa]/65 ml-2">RUNTIME STATE</span></h3>
        {!hasRuntime && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 border-[#2f7f68]/55 rounded-none text-[#8fb7aa] hover:bg-[#2f7f68] hover:text-[#06100d]"
            onClick={onInitializeRuntime}
          >
            初始化运行时状态
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: '体数 / HP', value: `${runtimePools.hp.current}/${runtimePools.hp.max}`, onMinus: () => onRuntimeDelta('HP', -1, changeHp), onPlus: () => onRuntimeDelta('HP', 1, changeHp) },
          { label: '魔法 / MP', value: `${runtimePools.mp.current}/${runtimePools.mp.max}`, onMinus: () => onRuntimeDelta('MP', -1, changeMp), onPlus: () => onRuntimeDelta('MP', 1, changeMp) },
          { label: '理智 / SAN', value: `${runtimePools.san.current}/${runtimePools.san.max}`, onMinus: () => onRuntimeDelta('SAN', -1, changeSan), onPlus: () => onRuntimeDelta('SAN', 1, changeSan) },
          { label: '幸运 / Luck', value: `${runtimePools.luck.current}/${luckMax}`, onMinus: () => onRuntimeDelta('Luck', -1, changeLuck), onPlus: () => onRuntimeDelta('Luck', 1, changeLuck) },
        ].map(item => (
          <div key={item.label} className="border border-[#2f7f68]/25 bg-black/30 p-3">
            <div className="text-[10px] uppercase tracking-widest text-[#8fb7aa] mb-1">{item.label}</div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-2xl font-bold text-[#d4d4d8] font-mono">{item.value}</div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-7 px-2 border-[#2f7f68]/55 rounded-none text-[#d4d4d8] hover:bg-red-900" onClick={item.onMinus}>-1</Button>
                <Button size="sm" variant="outline" className="h-7 px-2 border-[#2f7f68]/55 rounded-none text-[#d4d4d8] hover:bg-[#2f7f68] hover:text-[#06100d]" onClick={item.onPlus}>+1</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border border-[#2f7f68]/25 bg-black/20 p-3">
        <div className="text-[10px] uppercase tracking-widest text-[#8fb7aa] mb-2">状态标记 <span className="text-[#8fb7aa]/65">RUNTIME FLAGS</span></div>
        <div className="flex flex-wrap gap-2">
          {flagItems.map(flag => {
            const active = runtimeFlags[flag.key];
            return (
              <button
                key={flag.key}
                type="button"
                className={`border px-2 py-1 text-[11px] transition-colors ${
                  active
                    ? 'border-red-500/70 bg-red-950/50 text-red-200'
                    : 'border-[#2f7f68]/35 bg-[#111] text-[#8fb7aa]'
                }`}
                onClick={() => onToggleFlag(flag, active)}
              >
                {flag.label} / {flag.english}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[10px] text-[#8fb7aa]">
          标记仅供手动维护；本轮不执行疯狂表、INT 检定或 Keeper 流程。
        </div>
      </div>

      <div className="mt-8 border-t border-[#2f7f68]/30 pt-4">
        <h3 className="text-[#8fb7aa] font-bold uppercase mb-2">常用检定 <span className="text-[10px] tracking-widest text-[#8fb7aa]/65 ml-2">QUICK ROLLS</span></h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="text-xs h-8 rounded-none border-[#2f7f68] text-[#8fb7aa] hover:bg-[#2f7f68] hover:text-[#06100d]" onClick={onSanQuickRoll}>
            理智检定 (Sanity Check)
          </Button>
        </div>
      </div>
    </div>
  );
}
