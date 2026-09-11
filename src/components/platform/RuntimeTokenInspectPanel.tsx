import { useEffect, useRef } from 'react';
import type { Combatant } from '../../lib/combat/combatRuntimeTypes';
import type { MapToken } from '../../lib/map/mapRuntimeTypes';
import type { RuntimeAcDisplay, RuntimeHpDisplay, RuntimeTokenRelation } from '../../lib/platform/roomRuntimeVisibility';

type Props = {
  token: MapToken;
  combatant?: Combatant;
  role: 'host' | 'player' | 'spectator';
  onClose: () => void;
  onControl?: () => void;
  onOpenActor?: () => void;
  actorLinkLabel?: string;
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
export function RuntimeTokenInspectPanel({ token, combatant, role, onClose, onControl, onOpenActor, actorLinkLabel }: Props) {
  const dialog = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => previous?.focus();
  }, []);
  const relation = token.relation ?? combatant?.relation ?? 'unknown';
  const hp = combatant?.hpDisplay ?? token.hpDisplay;
  const ac = combatant?.acDisplay ?? token.acDisplay;
  const conditions = combatant?.conditions?.length ? combatant.conditions : token.conditionSummary ?? [];
  const isHost = role === 'host';
  const initiative = combatant?.initiative;

  return <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4" role="presentation" onPointerDown={onClose}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-label={`${token.displayName ?? token.name} 的查看信息`} onPointerDown={(event) => event.stopPropagation()} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
      if (event.key === 'Tab') {
        const elements = Array.from<HTMLElement>(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), summary') ?? []);
        const first = elements[0], last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }} className="w-full max-w-sm rounded-xl border border-slate-300 bg-white p-4 shadow-2xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">查看信息</div>
          <h3 className="mt-0.5 text-base font-black text-slate-800">{token.displayName ?? token.name}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100">关闭</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-700">
        <span className="rounded bg-slate-100 px-1.5 py-1">关系：{relationLabel[relation]}</span>
        <span className="rounded bg-slate-100 px-1.5 py-1">{hpLabel(hp)}</span>
        <span className="rounded bg-slate-100 px-1.5 py-1">{acLabel(ac)}</span>
      </div>
      <div className="mt-2 text-[11px] text-slate-700"><b>状态：</b>{conditions.length > 0 ? conditions.join('、') : '可见状态暂无'}</div>
      {initiative !== undefined && <div className="mt-2 text-[11px] text-slate-700"><b>先攻：</b>{initiative}</div>}
      {onOpenActor && <button type="button" className="mt-3 mr-2 min-h-9 rounded border border-slate-300 px-3 font-bold" onClick={onOpenActor}>{actorLinkLabel}</button>}
      {onControl && combatant && <button type="button" className="mt-3 min-h-9 rounded bg-slate-800 px-3 text-white" onClick={onControl}>使用此角色行动</button>}
      <details className="mt-3 text-[11px] leading-5 text-slate-600"><summary className="cursor-pointer">信息说明</summary><div>
        <b>可见信息</b><br />{isHost ? '主持人可查看当前 Token 已接入的完整信息与主持人记录。' : relation === 'self' ? '这是你的已接入角色信息。' : '这里会汇总你目前已获准查看的信息；后续公开或识别出的资料也会显示在这里。'}
      </div>
      {!isHost && relation !== 'self' && <p className="mt-2 text-[10px] leading-5 text-slate-500">更详细的背景、特性与识别结果会在主持人公开后显示。</p>}
      </details>
      {isHost && token.notes && <div className="mt-3 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900"><b>主持人记录</b><br />{token.notes}</div>}
    </section>
  </div>;
}
