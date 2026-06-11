import { Button } from '../../../components/ui/button';
import type { CocSkill } from '../../lib/coc-types';

type CocChecksPanelProps = {
  skills: CocSkill[];
  onRollSkill: (skill: CocSkill) => void;
  growthMarks?: Record<string, boolean>;
  pendingGrowthMark?: {
    sourceEntryId: string;
    skillName: string;
    skillValue: number;
  } | null;
  onMarkGrowth?: () => void;
  onClearPendingGrowth?: () => void;
  onGrowthCheck?: (skill: CocSkill) => void;
  onClearGrowthMark?: (skillName: string) => void;
  pendingLuckSpend?: {
    sourceEntryId?: string;
    skillName: string;
    roll: number;
    skillValue: number;
    neededLuck: number;
    canSpend: boolean;
    reason?: string;
  } | null;
  onSpendLuck?: () => void;
  onClearLuckSpend?: () => void;
  pendingPushedRoll?: {
    sourceEntryId: string;
    skillName: string;
    skillValue: number;
    originalRoll: number;
  } | null;
  onPushedRoll?: () => void;
  onClearPushedRoll?: () => void;
};

export function CocChecksPanel({
  skills,
  onRollSkill,
  growthMarks = {},
  pendingGrowthMark,
  onMarkGrowth,
  onClearPendingGrowth,
  onGrowthCheck,
  onClearGrowthMark,
  pendingLuckSpend,
  onSpendLuck,
  onClearLuckSpend,
  pendingPushedRoll,
  onPushedRoll,
  onClearPushedRoll,
}: CocChecksPanelProps) {
  const sortedSkills = [...skills].sort((a, b) => a.name.localeCompare(b.name));
  const growthMarkedSkills = sortedSkills.filter(skill => growthMarks[skill.name]);

  return (
    <div className="border border-[#2f7f68]/35 bg-[#101413] p-4">
      <div className="border-b border-[#2f7f68]/30 pb-2 mb-3">
        <h3 className="text-[#8fb7aa] font-bold uppercase">技能检定 <span className="text-[10px] tracking-widest text-[#8fb7aa]/65 ml-2">SKILL CHECKS</span></h3>
        <p className="mt-1 text-xs text-[#8fb7aa]">
          本轮执行公开技能检定；失败后可进行最小 Luck Spending 或 Pushed Roll。成功后可标记成长检查。
        </p>
      </div>

      {pendingGrowthMark && (
        <div className="mb-3 border border-[#4f8f7d]/45 bg-[#0c1714] p-3">
          <div className="text-xs font-bold text-[#8fb7aa]">成长标记 / Growth Mark</div>
          <div className="mt-1 text-xs text-[#d4d4d8]">
            {pendingGrowthMark.skillName} 检定成功，可标记为幕间成长检查。
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-7 rounded-none bg-[#2f7f68] px-3 text-xs font-bold text-[#06100d] hover:bg-[#8fb7aa]"
              onClick={onMarkGrowth}
            >
              标记成长
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-none border-[#2f7f68]/55 px-3 text-xs text-[#8fb7aa] hover:bg-[#2f7f68] hover:text-[#06100d]"
              onClick={onClearPendingGrowth}
            >
              跳过
            </Button>
          </div>
        </div>
      )}

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

      {pendingPushedRoll && (
        <div className="mb-3 border border-[#2f7f68]/45 bg-[#0d1815] p-3">
          <div className="text-xs font-bold text-[#8fb7aa]">Pushed Roll</div>
          <div className="mt-1 text-xs text-[#d4d4d8]">
            可对 {pendingPushedRoll.skillName} 追加一次 Pushed Roll。原始失败 {pendingPushedRoll.originalRoll} / {pendingPushedRoll.skillValue} 会保留；失败后果由 Keeper 裁定。
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="h-7 rounded-none bg-[#2f7f68] px-3 text-xs font-bold text-[#06100d] hover:bg-[#8fb7aa]"
              onClick={onPushedRoll}
            >
              Pushed Roll
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-none border-[#2f7f68]/55 px-3 text-xs text-[#8fb7aa] hover:bg-[#2f7f68] hover:text-[#06100d]"
              onClick={onClearPushedRoll}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      {growthMarkedSkills.length > 0 && (
        <div className="mb-3 border border-[#2f7f68]/35 bg-black/25 p-3">
          <div className="text-xs font-bold text-[#8fb7aa]">已标记成长 / MARKED FOR GROWTH</div>
          <div className="mt-2 space-y-2">
            {growthMarkedSkills.map(skill => (
              <div key={skill.name} className="flex flex-wrap items-center justify-between gap-2 border border-[#2f7f68]/20 bg-[#101413] px-2 py-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-[#d4d4d8]" title={skill.name}>{skill.name}</div>
                  <div className="text-[10px] text-[#8fb7aa]">当前值 {skill.value}；成长检定需 1d100 &gt; 当前值</div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 rounded-none bg-[#2f7f68] px-3 text-xs font-bold text-[#06100d] hover:bg-[#8fb7aa]"
                    onClick={() => onGrowthCheck?.(skill)}
                  >
                    成长检定
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-none border-[#2f7f68]/55 px-3 text-xs text-[#8fb7aa] hover:bg-[#2f7f68] hover:text-[#06100d]"
                    onClick={() => onClearGrowthMark?.(skill.name)}
                  >
                    清除
                  </Button>
                </div>
              </div>
            ))}
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
