import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { RoomAttackResolutionDetails } from './RoomAttackResolutionDetails';
import { dndAttackErrorText, RuntimeDndActionPanel } from './RuntimeDndActionPanel';
import { RoomServerHttpError } from '../../lib/platform/roomServerHttpClient';
import { projectAttackResolvedFacts } from '../../../server/room/projectAttackResolvedFacts';

const raw = {
  actorCombatantId: 'pc', targetCombatantId: 'npc',
  resolution: { attackRawRolls: [17, 4], attackKeptRoll: 17, attackBonus: 5, attackTotal: 22,
    damageRawRolls: [[6]], damageFormula: '1d8+3', damageTotal: 9, damageType: 'piercing' },
  privileged: { targetAc: 19, absorbedByTemporaryHp: 2, amount: 7, secret: 'private memo' },
  mutations: [{ type: 'combatantHp', combatantId: 'npc', beforeHp: 31, afterHp: 24, beforeTemporaryHp: 2, afterTemporaryHp: 0 }],
};
const exact = projectAttackResolvedFacts(raw, { hpDisplay: { kind: 'exact', current: 24, temporary: undefined }, acDisplay: { kind: 'exact', value: 19 } });
const visible = renderToStaticMarkup(<RoomAttackResolutionDetails payload={exact} />);
for (const text of ['17, 4', '目标 AC 19', 'HP 31 → 24', '临时 HP 2 → 0', '实际扣除 HP：7', 'piercing']) assert.ok(visible.includes(text), text);
assert.ok(!visible.includes('private memo'));
const limited = projectAttackResolvedFacts(raw, { hpDisplay: { kind: 'stage', stage: 'wounded' }, acDisplay: { kind: 'unknown' } });
const hidden = renderToStaticMarkup(<RoomAttackResolutionDetails payload={limited} />);
assert.ok(hidden.includes('17, 4'));
for (const text of ['目标 AC', 'HP', '实际扣除', 'private memo']) assert.ok(!hidden.includes(text), text);
assert.doesNotThrow(() => renderToStaticMarkup(<RoomAttackResolutionDetails payload={undefined} />));
const panel = renderToStaticMarkup(<RuntimeDndActionPanel scopeKey="test" actorCombatantId="pc"
  actions={[{ id: 'sword', name: 'Sword', kind: 'weapon_attack' }]} targets={[{ id: 'npc', label: 'Target' }]}
  selectedTargetId="npc" onDeclare={async () => { throw new Error('render never declares'); }} />);
// Deliberate UX label change; intent submission and all visibility assertions remain.
assert.ok(panel.includes('>攻击</button>'));
assert.ok(!panel.includes('攻击掷骰'));
assert.ok(!panel.includes('掷伤害'));
const empty = renderToStaticMarkup(<RuntimeDndActionPanel scopeKey="empty" actorCombatantId="pc" actions={[]} />);
assert.ok(empty.includes('暂无已编写的攻击'));
assert.equal(dndAttackErrorText(new RoomServerHttpError(409, 'dnd_attack_out_of_range')), '目标超出此攻击的近战范围。');
console.log('T12 rendering smoke passed: structured attack details, projection-gated vitals, no hidden-value fallback, intent button and authored-action empty state.');
