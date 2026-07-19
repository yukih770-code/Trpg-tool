import type { Combatant } from '../../lib/combat/combatRuntimeTypes';
import type { MapToken } from '../../lib/map/mapRuntimeTypes';
import type { RuntimeAcDisplay, RuntimeHpDisplay, RuntimeTokenRelation } from '../../lib/platform/roomRuntimeVisibility';

type Props = {
  token: MapToken;
  combatant?: Combatant;
  role: 'host' | 'player' | 'spectator';
  onClose: () => void;
};

const relationLabel: Record<RuntimeTokenRelation, string> = {
  self: '自己',
  ally: '队友',
  enemy: '敌人',
  npc: 'NPC',
  object: '物体',
  unknown: '未知',
};

const injuryLabel: Record<NonNullable<Extract<RuntimeHpDisplay, { kind: 'stage' }>['stage']>, string> = {
  uninjured: '未受伤',
  wounded: '轻伤',
  bloodied: '重伤',
  nearDeath: '濒死',
  defeated: '已倒下',
};

function hpLabel(display?: RuntimeHpDisplay): string {
  if (!display || display.kind === 'unknown') return 'HP：未知';
  if (display.kind === 'stage') return `生命状态：${injuryLabel[display.stage]}`;
  return `HP：${display.current ?? '—'}${display.max === undefined ? '' : `/${display.max}`}${display.temporary ? `（临时 ${display.temporary}）` : ''}`;
}

function acLabel(display?: RuntimeAcDisplay): string {
  return display?.kind === 'exact' ? `AC：${display.value}` : 'AC：未知';
}

/** A read-only surface over server-projected Token/Combatant data. It never
 * fetches a raw actor, clearance record, or internal Token payload. */
export function RuntimeTokenInspectPanel({ token, combatant, role, onClose }: Props) {
  const relation = token.relation ?? combatant?.relation ?? 'unknown';
  const hp = combatant?.hpDisplay ?? token.hpDisplay;
  const ac = combatant?.acDisplay ?? token.acDisplay;
  const conditions = combatant?.conditions?.length ? combatant.conditions : token.conditionSummary ?? [];
  const isHost = role === 'host';

  return <section className="rounded border border-slate-300/70 bg-white/90 p-3 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Token 信息</div>
        <h3 className="mt-0.5 text-sm font-black text-slate-800">{token.displayName ?? token.name}</h3>
      </div>
      <button type="button" onClick={onClose} className="rounded px-1.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-100">关闭</button>
    </div>
    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-700">
      <span className="rounded bg-slate-100 px-1.5 py-1">关系：{relationLabel[relation]}</span>
      <span className="rounded bg-slate-100 px-1.5 py-1">{hpLabel(hp)}</span>
      <span className="rounded bg-slate-100 px-1.5 py-1">{acLabel(ac)}</span>
    </div>
    <div className="mt-2 text-[11px] text-slate-700">
      <b>状态：</b>{conditions.length > 0 ? conditions.join('、') : '可见状态暂无'}
    </div>
    <div className="mt-2 rounded bg-slate-50 px-2.5 py-2 text-[11px] leading-5 text-slate-600">
      <b>已知信息</b><br />{isHost ? '主持人可查看当前 Token 的完整已接入信息。' : relation === 'self' ? '这是你的已接入角色信息。' : '只显示当前对你可见的信息。'}
    </div>
    {!isHost && relation !== 'self' && <div className="mt-2 rounded border border-slate-200 px-2.5 py-2 text-[11px] text-slate-600"><b>调查</b><br />调查检定与信息揭示将在后续版本加入。</div>}
    {isHost && token.notes && <div className="mt-2 rounded border border-amber-300/50 bg-amber-50 px-2.5 py-2 text-[11px] leading-5 text-amber-900"><b>主持人备注</b><br />{token.notes}</div>}
  </section>;
}
