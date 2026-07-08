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
 */
import { randomInt } from 'node:crypto';
import { appendRuntimeLogEvent } from './appendRuntimeLogEvent.js';
import { rollSharedDiceExpression, formatSharedDiceRoll } from '../../src/lib/platform/sharedDiceExpression.js';
/** Unbiased server RNG in [1, sides]. */
function cryptoDiceRng(sides) {
    return randomInt(1, sides + 1);
}
export function rollSharedDice(roomRegistry, logRegistry, input) {
    const room = roomRegistry.get(input.roomId);
    if (!room)
        return { decision: 'roomNotFound', message: `No room "${input.roomId}".` };
    const member = room.members.find((m) => m.memberId === input.memberId);
    if (!member)
        return { decision: 'memberNotFound', message: `No member "${input.memberId}".` };
    if (member.status !== 'active') {
        return { decision: 'memberNotActive', message: `Member status is "${member.status}".` };
    }
    const outcome = rollSharedDiceExpression(input.expression, cryptoDiceRng, input.label);
    if (outcome.ok === false)
        return { decision: outcome.code, message: outcome.message };
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
            decision: appended.decision === 'memberNotFound'
                ? 'memberNotFound'
                : appended.decision === 'memberNotActive'
                    ? 'memberNotActive'
                    : 'invalidExpression',
            message: appended.message,
        };
    }
    return { decision: 'rolled', event: appended.event, roll };
}
