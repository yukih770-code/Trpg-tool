import { replayCombatRuntimeEvents, type CombatRuntimeReplayEvent } from './combatRuntimeReplay';

const createdAt = '2026-07-16T00:00:00.000Z';

function event(seq: number, eventKind: string, payload: Record<string, unknown> = {}): CombatRuntimeReplayEvent {
  return { seq, eventKind, payload, createdAt };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
}

const alpha = {
  id: 'alpha',
  name: 'Alpha',
  displayName: 'Alpha',
  sourceType: 'manual_pc',
  kind: 'character',
  initiativeModifier: 2,
  conditions: [],
  hpCurrent: 10,
  hpMax: 10,
};

const beta = {
  id: 'beta',
  name: 'Beta',
  displayName: 'Beta',
  sourceType: 'manual_npc',
  kind: 'npc',
  initiativeModifier: 0,
  conditions: [],
};

const events: CombatRuntimeReplayEvent[] = [
  event(10, 'combat.unknown_future_event', { ignored: true }),
  event(9, 'combat.ended', { roundNumber: 2, turnIndex: 0, activeCombatantId: 'alpha' }),
  event(8, 'combat.combatant_removed', { combatantId: 'beta' }),
  event(7, 'combat.combatant_updated', { combatant: { id: 'alpha', hpCurrent: 3, conditions: ['stunned'] } }),
  event(6, 'combat.resumed', { roundNumber: 2, turnIndex: 0, activeCombatantId: 'alpha' }),
  event(5, 'combat.paused', { roundNumber: 2, turnIndex: 0, activeCombatantId: 'alpha' }),
  event(4, 'combat.round_advanced', { roundNumber: 2, turnIndex: 0, activeCombatantId: 'alpha' }),
  event(3, 'combat.turn_advanced', { roundNumber: 1, turnIndex: 1, activeCombatantId: 'beta' }),
  event(2, 'combat.started', { roundNumber: 1, turnIndex: 0, activeCombatantId: 'alpha' }),
  event(1, 'combat.combatant_added', { combatant: alpha }),
  event(0, 'combat.combatant_added', { combatant: beta }),
];

const cases: Array<{ name: string; run: () => void }> = [
  {
    name: 'replays in sequence order regardless of response order',
    run: () => {
      const first = replayCombatRuntimeEvents(events);
      const second = replayCombatRuntimeEvents([...events].reverse());
      assertEqual(first, second, 'replay should be deterministic');
    },
  },
  {
    name: 'adds, updates, and removes combatants',
    run: () => {
      const state = replayCombatRuntimeEvents(events);
      assertEqual(state.combatants.length, 1, 'removed combatant should not remain');
      assertEqual(state.combatants[0]?.id, 'alpha', 'alpha should remain');
      assertEqual(state.combatants[0]?.hpCurrent, 3, 'partial update should preserve and update hp');
      assertEqual(state.combatants[0]?.conditions, ['stunned'], 'partial update should update conditions');
    },
  },
  {
    name: 'replays start, turn, and round transitions',
    run: () => {
      const state = replayCombatRuntimeEvents(events.slice(1).filter((item) => item.seq <= 4));
      assertEqual(state.turn.status, 'active', 'combat should be active after round advance');
      assertEqual(state.turn.roundNumber, 2, 'round advance should be restored');
      assertEqual(state.turn.turnIndex, 0, 'turn index should be restored');
      assertEqual(state.turn.activeCombatantId, 'alpha', 'active combatant should be restored');
    },
  },
  {
    name: 'restores the combat-start initiative snapshot',
    run: () => {
      const state = replayCombatRuntimeEvents([
        event(1, 'combat.started', {
          combatants: [{ ...alpha, initiative: 17 }, { ...beta, initiative: 11 }],
          roundNumber: 1,
          turnIndex: 0,
          activeCombatantId: 'alpha',
        }),
      ]);
      assertEqual(state.combatants.map((combatant) => combatant.initiative), [17, 11], 'start payload initiatives should be restored');
      assertEqual(state.turn.activeCombatantId, 'alpha', 'start payload current combatant should be restored');
    },
  },
  {
    name: 'replays an initiative roll event like a targeted combatant update',
    run: () => {
      const state = replayCombatRuntimeEvents([
        event(0, 'combat.combatant_added', { combatant: alpha }),
        event(1, 'combat.initiative_rolled', { combatant: { id: 'alpha', initiative: 19 } }),
      ]);
      assertEqual(state.combatants[0]?.initiative, 19, 'initiative roll should update the combatant');
    },
  },
  {
    name: 'replays pause and resume states',
    run: () => {
      const paused = replayCombatRuntimeEvents(events.filter((item) => item.seq <= 5));
      const resumed = replayCombatRuntimeEvents(events.filter((item) => item.seq <= 6));
      assertEqual(paused.turn.status, 'paused', 'pause should be restored');
      assertEqual(resumed.turn.status, 'active', 'resume should be restored');
    },
  },
  {
    name: 'replays end state',
    run: () => {
      assertEqual(replayCombatRuntimeEvents(events).turn.status, 'ended', 'end should be restored');
    },
  },
  {
    name: 'tolerates missing and unknown payloads',
    run: () => {
      const state = replayCombatRuntimeEvents([
        event(1, 'combat.combatant_added'),
        event(2, 'combat.combatant_updated', { combatant: { id: 'missing' } }),
        event(3, 'combat.combatant_removed'),
        event(4, 'combat.future_event', { value: { unexpected: true } }),
      ]);
      assertEqual(state.combatants.length, 0, 'malformed events should not create state');
      assertEqual(state.turn.status, 'setup', 'malformed events should not change turn state');
    },
  },
];

const results = cases.map((test) => {
  try {
    test.run();
    return { name: test.name, passed: true };
  } catch (error) {
    return { name: test.name, passed: false, error: error instanceof Error ? error.message : String(error) };
  }
});

const failed = results.filter((result) => !result.passed);
console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, cases: results }, null, 2));
if (failed.length > 0) process.exitCode = 1;
