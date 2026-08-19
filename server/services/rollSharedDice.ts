/**
 * rollSharedDice service (Shared Dice v0, server-authoritative).
 *
 * AI-LANDMARK: ROOM_SERVER_ROLL_SHARED_DICE_V0
 *
 * Uses the SHARED pure parser (sharedDiceExpression) and rolls with node:crypto's
 * unbiased randomInt (server authority — the client never computes randomness).
 * Writes a PUBLIC `dice.roll` RuntimeLog event via appendRuntimeLogEvent
 * (RuntimeLog is the only authoritative record — no separate dice registry). The
 * HTTP handler broadcasts it via the existing runtimeLogAppended. Manual fallback
 * tray — NOT a rules engine. No eval, no new dependency.
 *
 * T1: the request may additionally carry semantic d20 intent (`mode`, `dc`).
 * That intent is passed to the same shared pure roller; the resolved faces,
 * kept die, total and DC outcome are computed HERE from the crypto RNG and are
 * never accepted from the client. The event kind stays `dice.roll`.
 */

import { randomInt } from 'node:crypto';

import type { RoomRegistry } from '../room-registry.js';
import type { RuntimeLogRegistry } from '../runtime-log-registry.js';
import type { RoomRuntimeLogEvent, SharedDiceRollMode, SharedDiceRollResult } from '../protocol/room-protocol.js';
import { appendRuntimeLogEvent } from './appendRuntimeLogEvent.js';
import { rollSharedDiceExpression, formatSharedDiceRoll } from '../../src/lib/platform/sharedDiceExpression.js';

export interface RollSharedDiceInput {
  roomId: string;
  memberId: string;
  expression: string;
  label?: string;
  /** Semantic d20 intent only; rejected unless the expression is a single d20. */
  mode?: SharedDiceRollMode;
  /** Semantic check DC only; rejected unless the expression is a single d20. */
  dc?: number;
}

export interface RollSharedDiceResult {
  decision:
    | 'rolled'
    | 'roomNotFound'
    | 'roomClosed'
    | 'memberNotFound'
    | 'memberNotActive'
    | 'invalidExpression'
    | 'expressionTooLarge'
    | 'invalidRollMode'
    | 'invalidDc';
  event?: RoomRuntimeLogEvent;
  roll?: SharedDiceRollResult;
  message?: string;
}

/** Unbiased server RNG in [1, sides]. */
function cryptoDiceRng(sides: number): number {
  return randomInt(1, sides + 1);
}

export function rollSharedDice(
  roomRegistry: RoomRegistry,
  logRegistry: RuntimeLogRegistry,
  input: RollSharedDiceInput,
): RollSharedDiceResult {
  const room = roomRegistry.get(input.roomId);
  if (!room) return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
  if (room.identity.lifecycleStatus === 'closed' || room.identity.lifecycleStatus === 'archived') {
    return { decision: 'roomClosed', message: 'The room is closed.' };
  }

  const member = room.members.find((m) => m.memberId === input.memberId);
  if (!member) return { decision: 'memberNotFound', message: `No member "${input.memberId}".` };
  if (member.status !== 'active') {
    return { decision: 'memberNotActive', message: `Member status is "${member.status}".` };
  }

  const outcome = rollSharedDiceExpression(input.expression, cryptoDiceRng, {
    label: input.label,
    mode: input.mode,
    dc: input.dc,
  });
  if (outcome.ok === false) return { decision: outcome.code, message: outcome.message };
  const roll = outcome.roll;

  const appended = appendRuntimeLogEvent(roomRegistry, logRegistry, {
    roomId: input.roomId,
    authorMemberId: input.memberId,
    kind: 'dice.roll',
    visibility: 'public',
    text: formatSharedDiceRoll(roll),
    payload: roll,
  });
  if (appended.decision !== 'appended') {
    return {
      decision:
        appended.decision === 'memberNotFound'
          ? 'memberNotFound'
          : appended.decision === 'memberNotActive'
            ? 'memberNotActive'
            : 'invalidExpression',
      message: appended.message,
    };
  }

  return { decision: 'rolled', event: appended.event, roll };
}
