import { Button } from '../../../components/ui/button';
import type { CocSkill } from '../../lib/coc-types';

type CocChecksPanelProps = {
  skills: CocSkill[];
  onRollSkill: (skill: CocSkill) => void;
  pendingLuckSpend?: {
    skillName: string;
    roll: number;
    skillValue: number;
    neededLuck: number;
    canSpend: boolean;
    reason?: string;
  } | null;
  onSpendLuck?: () => void;
  onClearLuckSpend?: () => void;
};

export function CocChecksPanel({
  skills,
  onRollSkill,
  pendingLuckSpend,
  onSpendLuck,
  onClearLuckSpend,
}: CocChecksPanelProps) {
  const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="border border-[#2f7f68]/35 bg-[#101413] p-4">
      <div className="border-b border-[#2f7f68]/30 pb-2 mb-3">
        <h3 className="text-[#8fb7aa] font-bold uppercase">技能检定 <span className="text-[10px] tracking-widest text-[#8fb7aa]/65 ml-2">SKILL CHECKS</span></h3>
        <p className="mt-1 text-xs text-[#8fb7aa]">
          本轮执行公开技能检定；失败后可进行最小 Luck Spending。Pushed Roll / 成长结算后续实现。
        </p>
      </div>

      {pendingLuckSpend && (
        <div className="mb-3 border border-[#b7a46a]/45 bg-[#19170f] p-3">
          <div className="text-xs font-bold text-[#d8c987]">Luck Spending</div>
          <div className="mt-1 text-xs text-[#d4d4d8]">
            {pendingLuckSpend.canSpend
              ? `可消耗 ${pendingLuckSpend.neededLuck} Luck 将 ${pendingLuckSpend.skillName} 改为普通成功。`
              : pendingLuckSpend.reason ?? `需要 ${pendingLuckSpend.neededLuck} Luck，当前 Luck 不足。`}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-7 rounded-none bg-[#b7a46a] px-3 text-xs font-bold text-[#111] hover:bg-[#d8c987]"
              disabled={!pendingLuckSpend.canSpend}
              onClick={onSpendLuck}
            >
              Spend Luck
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-none border-[#2f7f68]/55 px-3 text-xs text-[#8fb7aa] hover:bg-[#2f7f68] hover:text-[#06100d]"
              onClick={onClearLuckSpend}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      <div className="max-h-[420px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
        {sortedSkills.map(skill => {
          const half = Math.floor(skill.value / 2);
          const fifth = Math.floor(skill.value / 5);

          return (
            <div key={skill.name} className="border border-[#2f7f68]/22 bg-black/30 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-sm font-bold text-[#d4d4d8] truncate" title={skill.name}>
                    {skill.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[#8fb7aa]">
                    <span>当前值 {skill.value}</span>
                    <span>困难 {half}</span>
                    <span>极难 {fifth}</span>
                    <span>基础 {skill.baseValue}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    {skill.isOccupational && (
                      <span className="border border-[#34d399]/40 px-1.5 py-0.5 text-[#34d399]">本职</span>
                    )}
                    {skill.isPersonal && (
                      <span className="border border-[#a7f3d0]/40 px-1.5 py-0.5 text-[#a7f3d0]">兴趣</span>
                    )}
                    {!skill.isOccupational && !skill.isPersonal && (
                      <span className="border border-[#2f7f68]/25 px-1.5 py-0.5 text-[#8fb7aa]">公开</span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 rounded-none border-[#2f7f68]/55 text-[#8fb7aa] hover:bg-[#2f7f68] hover:text-[#06100d]"
                  onClick={() => onRollSkill(skill)}
                >
                  检定
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
