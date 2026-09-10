import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
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
