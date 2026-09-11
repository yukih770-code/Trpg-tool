import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Reads recorded outcome; presentation never re-evaluates AC or damage. */
export function RoomAttackResult({ event }: { event: RoomRuntimeLogEvent }) {
  const payload = record(event.payload);
  const facts = record(payload.resolution);
  const combatants = Array.isArray(payload.combatants) ? payload.combatants.map(record) : [];
  const name = (id: unknown) => {
    const candidate = combatants.find((item) => item.id === id)?.displayName;
    return typeof candidate === 'string' ? candidate : undefined;
  };
  const state = record(payload.privileged);
  const outcome = facts.critical ? '重击' : facts.outcome === 'hit' ? '命中' : facts.outcome === 'miss' ? '未命中' : '攻击';
  return <div className="live-attack-result">
    <strong>{outcome}{typeof facts.attackTotal === 'number' ? ` · ${facts.attackTotal}` : ''}</strong>
    <span>{name(payload.actorCombatantId) ?? '角色'} → {name(payload.targetCombatantId) ?? '目标'}</span>
    {typeof facts.damageTotal === 'number' && <span>伤害掷骰 <b>{facts.damageTotal}</b>{typeof facts.damageType === 'string' ? ` ${facts.damageType}` : ''}</span>}
    {typeof state.afterHp === 'number' && <span>HP {state.afterHp}{typeof state.afterTemporaryHp === 'number' && state.afterTemporaryHp > 0 ? ` · 临时 HP ${state.afterTemporaryHp}` : ''}</span>}
    <details><summary className="cursor-pointer text-xs underline">骰子与状态详情</summary><RoomAttackResolutionDetails payload={event.payload} /></details>
  </div>;
}

/** Presentation only: every value comes from the server's per-viewer payload. */
export function RoomAttackResolutionDetails({ payload }: { payload: RoomRuntimeLogEvent['payload'] }) {
  const p = record(payload);
  const facts = record(p.resolution);
  const target = record(p.privileged);
  const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  const rolls = (value: unknown) => Array.isArray(value) && value.every((item) => number(item) !== undefined) ? value.join(', ') : undefined;
  const combatants = Array.isArray(p.combatants) ? p.combatants.map(record) : [];
  const name = (id: unknown) => {
    const displayName = combatants.find((combatant) => combatant.id === id)?.displayName;
    return typeof displayName === 'string' ? displayName : undefined;
  };
  const actorName = name(p.actorCombatantId);
  const targetName = name(p.targetCombatantId);
  const attackRolls = rolls(facts.attackRawRolls);
  const damageRolls = Array.isArray(facts.damageRawRolls) ? facts.damageRawRolls.map(rolls).filter((value) => value !== undefined) : [];
  return <div className="mt-1 space-y-0.5 text-xs">
    {(actorName || targetName) && <p>{actorName ?? '行动角色'} → {targetName ?? '目标'}</p>}
    {attackRolls !== undefined && <p>攻击骰 [{attackRolls}] → {number(facts.attackKeptRoll)}{number(facts.attackBonus) !== undefined && <>；加值 {number(facts.attackBonus)}</>}</p>}
    {damageRolls.length > 0 && <p>伤害骰 {damageRolls.map((value) => `[${value}]`).join(' + ')}{typeof facts.damageFormula === 'string' && <>（{facts.damageFormula}）</>}{typeof facts.damageType === 'string' && <> · {facts.damageType}</>}</p>}
    {number(target.targetAc) !== undefined && <p>目标 AC {number(target.targetAc)}</p>}
    {number(target.afterHp) !== undefined && <p>HP {number(target.beforeHp)} → {number(target.afterHp)}</p>}
    {number(target.afterTemporaryHp) !== undefined && <p>临时 HP {number(target.beforeTemporaryHp)} → {number(target.afterTemporaryHp)}</p>}
    {number(target.absorbedByTemporaryHp) !== undefined && <p>临时 HP 吸收：{number(target.absorbedByTemporaryHp)}</p>}
    {number(target.amount) !== undefined && <p>实际扣除 HP：{number(target.amount)}</p>}
  </div>;
}
