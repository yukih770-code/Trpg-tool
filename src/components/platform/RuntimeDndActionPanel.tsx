import type { RoomRuntimeDndActionShortcut } from '../../lib/platform/roomRuntimeActorProjectionTypes';

export interface RuntimeDndActionPanelProps {
  characterName?: string;
  actions: RoomRuntimeDndActionShortcut[];
  targets?: Array<{ id: string; label: string }>;
  selectedTargetId?: string;
  onSelectTarget?: (targetId: string | undefined) => void;
  onRoll?: (input: { expression: string; label: string }) => void;
}

/**
 * Player-facing DND action palette for the Room Runtime.
 *
 * It is deliberately a roll launcher, not an authority surface: target choice
 * only enriches the append-only dice label, while hit resolution and HP changes
 * remain under the existing host-confirmed combat controls.
 */
export function RuntimeDndActionPanel({
  characterName,
  actions,
  targets = [],
  selectedTargetId,
  onSelectTarget,
  onRoll,
}: RuntimeDndActionPanelProps) {
  const selectedTarget = targets.find((target) => target.id === selectedTargetId);
  const labelPrefix = characterName?.trim() || '我的角色';
  const targetSuffix = selectedTarget ? ` → ${selectedTarget.label}` : '';

  const actionPresentation = (action: RoomRuntimeDndActionShortcut) => {
    switch (action.kind) {
      case 'weapon_attack': return { badge: '武器', tone: 'bg-[#8b3a2f]/10 text-[#8b3a2f]', summary: '武器攻击' };
      case 'spell_attack': return { badge: '法术', tone: 'bg-violet-100 text-violet-800', summary: '法术攻击' };
      case 'save_dc': return { badge: '豁免', tone: 'bg-sky-100 text-sky-800', summary: action.saveDc === undefined ? '豁免检定' : `${action.saveAbility ? `${saveAbilityLabel(action.saveAbility)}豁免 ` : ''}DC ${action.saveDc}` };
      case 'damage_only': return { badge: '伤害', tone: 'bg-amber-100 text-amber-900', summary: '效果伤害' };
      default: return { badge: '动作', tone: 'bg-slate-200 text-slate-700', summary: '自定义动作' };
    }
  };

  return (
    <div className="space-y-3 text-left">
      <header className="rounded-md border border-[#8b3a2f]/25 bg-[#fff5ed] p-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8b3a2f]/75">DND 动作</div>
        <div className="mt-0.5 text-sm font-black text-[#4a1e17]">{labelPrefix}的回合操作</div>
        <p className="mt-1 text-[10px] leading-relaxed text-[#6e4237]">先选择目标，再掷攻击或伤害。骰子会公开记录；命中和伤害结算仍由主持人确认。</p>
      </header>

      <div className="rounded-md border border-slate-300/60 bg-white/75 p-2">
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
          当前目标
          <select
            value={selectedTargetId ?? ''}
            onChange={(event) => onSelectTarget?.(event.target.value || undefined)}
            className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700"
          >
            <option value="">未选择目标</option>
            {targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
          </select>
        </label>
        {targets.length === 0 && <p className="mt-1 text-[9px] leading-relaxed text-slate-500">战斗开始后，可从地图或先攻栏选中目标。</p>}
      </div>

      {actions.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-400/45 bg-white/55 p-3 text-[11px] leading-relaxed text-slate-600">
          这个角色还没有可用动作。可先使用下方通用 d20；主持人可在战役角色资料中补充武器、法术或其他动作的攻击与伤害骰。
        </div>
      ) : (
        <div className="grid gap-2">
          {actions.map((action) => {
            const attack = action.attackBonus === undefined ? undefined : `d20${action.attackBonus >= 0 ? '+' : ''}${action.attackBonus}`;
            const presentation = actionPresentation(action);
            return (
              <article key={action.id} className="rounded-md border border-slate-300/65 bg-white/85 p-2.5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-[12px] font-black text-slate-800">{action.name}</h4>
                    <p className="mt-0.5 text-[9px] text-slate-500">
                      {presentation.summary}{attack ? ` · 攻击 ${attack}` : ''}{action.damageFormula ? ` · 伤害 ${action.damageFormula}${action.damageType ? ` ${action.damageType}` : ''}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${presentation.tone}`}>{presentation.badge}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {attack && <button type="button" disabled={!onRoll} onClick={() => onRoll?.({ expression: attack, label: `${labelPrefix} · ${action.name} 攻击${targetSuffix}` })} className="rounded border border-[#8b3a2f]/45 bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#6b281d] disabled:opacity-45">{action.kind === 'spell_attack' ? '法术攻击' : '攻击掷骰'}</button>}
                  {action.damageFormula && <button type="button" disabled={!onRoll} onClick={() => onRoll?.({ expression: action.damageFormula!, label: `${labelPrefix} · ${action.name} 伤害${targetSuffix}` })} className="rounded border border-amber-500/45 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-900 disabled:opacity-45">掷伤害 {action.damageFormula}</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 rounded-md border border-slate-300/60 bg-slate-50/80 p-2">
        <div>
          <div className="text-[10px] font-bold text-slate-700">通用检定</div>
          <div className="text-[9px] text-slate-500">没有专用动作时使用。</div>
        </div>
        <button type="button" disabled={!onRoll} onClick={() => onRoll?.({ expression: '1d20', label: `${labelPrefix} 检定${targetSuffix}` })} className="rounded border border-slate-400/50 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 disabled:opacity-45">掷 d20</button>
      </div>
    </div>
  );
}

function saveAbilityLabel(ability: NonNullable<RoomRuntimeDndActionShortcut['saveAbility']>): string {
  const labels: Record<NonNullable<RoomRuntimeDndActionShortcut['saveAbility']>, string> = {
    strength: '力量', dexterity: '敏捷', constitution: '体质', intelligence: '智力', wisdom: '感知', charisma: '魅力',
  };
  return labels[ability];
}
