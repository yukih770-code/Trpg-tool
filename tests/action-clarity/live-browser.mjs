import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

/** Real compiled server + PostgreSQL; seed data uses public APIs and dev-only
 * identities in the disposable acceptance harness. No responses are mocked. */
export async function verifyLiveActionClarity(browser, output) {
  const base = 'http://localhost:8798';
  const checks = [], contexts = [];
  const check = (name, value) => { assert.ok(value, name); checks.push(name); };
  const api = async (path, body, user = 'dev-user-001', method = body ? 'POST' : 'GET') => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', 'x-dev-user-id': user }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await r.json();
    assert.ok(r.ok, `${r.status} ${path} ${JSON.stringify(data)}`);
    return data.value ?? data;
  };
  const sheet = (name, kind) => ({ schemaVersion: 1, actorKind: kind, displayName: name,
    abilities: { strength: 14, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10 },
    proficiencyBonus: 2, defenses: { armorClass: 12, maxHp: 40, currentHp: 40 },
    actions: [{ id: 'clarity-strike', name: '练习攻击', kind: 'weapon_attack', attackBonus: 4, damageFormula: '1d4+2', damageType: 'piercing' }] });
  await fs.mkdir(output, { recursive: true });
  const world = await api('/api/world-servers', { serverHandle: 'clarity-' + Date.now(), displayName: 'Action Clarity Acceptance' });
  const { campaign } = await api(`/api/world-servers/${world.worldServerId}/campaigns`, { title: 'First-session clarity', systemId: 'dnd5e-2024' });
  const campPath = `/api/world-servers/${world.worldServerId}/campaigns/${campaign.campaignId}`;
  const { room } = await api('/rooms/create', { hostDisplayName: 'Clarity GM', systemId: 'dnd5e-2024', campaignRef: { campaignId: campaign.campaignId, worldServerId: world.worldServerId, systemId: 'dnd5e-2024', displayName: campaign.title, source: 'unknown' } });
  const roomPath = '/rooms/' + room.identity.roomId, hostMember = room.members[0].memberId;
  const player = await api('/rooms/join', { inviteCodeOrRoomCode: room.identity.roomCode, requestedDisplayName: 'Clarity Player', requestedRole: 'player' }, 'clarity-player');
  await api(`${roomPath}/members/${player.memberId}/approve`, { decidedByMemberId: hostMember });
  const vault = await api('/api/actors', { systemId: 'dnd5e-2024', localActorId: 'clarity-' + Date.now(), displayName: 'Clarity Hero', payload: {} }, 'clarity-player');
  const submission = await api(roomPath + '/actor-bindings/submit', { memberId: player.memberId, actorRef: { systemId: 'dnd5e-2024', actorId: vault.actorId, displayName: 'Clarity Hero', source: 'characterVault' } }, 'clarity-player');
  await api(`${roomPath}/actor-bindings/${submission.bindingId}/approve`, { reviewerMemberId: hostMember });
  const snapshot = await api(roomPath + '?memberId=' + hostMember);
  const binding = snapshot.lobby.actorBindings.find(b => b.bindingId === submission.bindingId);
  const originalOverride = { dndLiteActorSheetV1: sheet('Clarity Hero', 'pc') };
  const pcActor = await api(`${campPath}/actors/${binding.campaignActorInstanceId}`, { overridePayload: originalOverride }, 'dev-user-001', 'PATCH');
  const npcActor = await api(campPath + '/actors', { displayName: 'Clarity Guard', actorKind: 'npc', overridePayload: { dndLiteActorSheetV1: sheet('Clarity Guard', 'npc') } });
  const open = async (member, user, role, viewport) => {
    const context = await browser.newContext({ viewport: viewport ?? { width: 1440, height: 1000 } }); contexts.push(context);
    const page = await context.newPage(); page.setDefaultTimeout(10000);
    await page.goto(`http://localhost:3000/tests/action-clarity/?room=${room.identity.roomId}&member=${member}&user=${user}&role=${role}`);
    return page;
  };
  try {
    const host = await open(hostMember, 'dev-user-001', 'host');
    const combatants = await host.evaluate(async ({ pcId, npcId }) => {
      const { createCombatant } = await import('/src/lib/combat/combatRuntimeTypes.ts');
      return [createCombatant({ id: 'clarity-pc', displayName: 'Clarity Hero', kind: 'character', sourceActorInstanceId: pcId, mapTokenId: 'clarity-pc-token', hpCurrent: 40, hpMax: 40, armorClass: 12, initiativeModifier: 0, conditions: [] }),
        createCombatant({ id: 'clarity-npc', displayName: 'Clarity Guard', kind: 'npc', sourceActorInstanceId: npcId, mapTokenId: 'clarity-npc-token', hpCurrent: 40, hpMax: 40, armorClass: 12, initiativeModifier: 0, conditions: [] })];
    }, { pcId: pcActor.campaignActorInstanceId, npcId: npcActor.campaignActorInstanceId });
    for (const [i, c] of combatants.entries()) await api(roomPath + '/map-events', { authorMemberId: hostMember, mapId: 'room:' + room.identity.roomId, eventKind: 'map.token_added', payload: { token: {
      id: c.mapTokenId, name: c.displayName, displayName: c.displayName, x: 40 + i * 20, y: 50, size: 'medium', kind: i ? 'monster' : 'playerCharacter',
      sourceType: 'campaign_actor', sourceActorInstanceId: c.sourceActorInstanceId, campaignActorId: c.sourceActorInstanceId, combatantId: c.id, sourceCombatantId: c.id, visibility: 'publicShared',
      ...(i ? {} : { actorBindingId: binding.bindingId, roomMemberId: player.memberId }) } } });
    await api(roomPath + '/runtime-log/events', { authorMemberId: hostMember, kind: 'combat.started', visibility: 'public', payload: { combatants, roundNumber: 1, turnIndex: 0, activeCombatantId: 'clarity-pc' }, text: 'Acceptance combat started' });
    await api(`${roomPath}/members/${player.memberId}/ready`, { ready: true }, 'clarity-player');
    await host.getByRole('button', { name: '以主持人身份进入桌面', exact: true }).click();
    const own = await open(player.memberId, 'clarity-player', 'player', { width: 390, height: 844 });
    await own.getByRole('button', { name: '进入跑团桌面', exact: true }).click();
    await own.getByRole('combobox', { name: '攻击目标', exact: true }).selectOption('clarity-npc');
    await own.getByRole('button', { name: '攻击', exact: true }).click();
    await own.locator('[data-previous-attack-result]').waitFor();
    check('owned player attack resolves through real server', true);
    await host.getByRole('combobox', { name: '控制角色 / NPC', exact: true }).selectOption('clarity-npc');
    await host.getByRole('combobox', { name: '攻击目标', exact: true }).selectOption('clarity-pc');
    await host.getByRole('button', { name: '攻击', exact: true }).click();
    await host.locator('[data-previous-attack-result]').waitFor();
    check('host NPC attack resolves through real server', true);
    await api(`${campPath}/actors/${pcActor.campaignActorInstanceId}`, { overridePayload: { dndLiteActorSheetV1: { ...originalOverride.dndLiteActorSheetV1, actions: [] } } }, 'dev-user-001', 'PATCH');
    await own.getByRole('button', { name: '攻击', exact: true }).click();
    await own.getByText('该攻击已变更或不可用，请刷新动作后重新选择。', { exact: true }).waitFor();
    check('server rereads actions and rejects removed action; old success is collapsed', !await own.locator('[data-previous-attack-result]').evaluate(e => e.open));
    await own.screenshot({ path: output + '/real-player-rejection.png' });
    await api(`${campPath}/actors/${pcActor.campaignActorInstanceId}`, { overridePayload: originalOverride }, 'dev-user-001', 'PATCH');
    let lost;
    await own.route('**/runtime/dnd-attack', async route => { const r = await route.fetch(); lost = await r.json(); await route.abort('failed'); }, { times: 1 });
    await own.getByRole('button', { name: '攻击', exact: true }).click();
    await own.getByText('本次攻击结果尚未确认', { exact: true }).waitFor();
    const restored = own.waitForResponse(r => r.url().endsWith('/runtime/dnd-attack'));
    await own.getByRole('button', { name: '重试同一攻击', exact: true }).click();
    const replay = await (await restored).json();
    await own.getByText('已恢复原始结果。', { exact: true }).waitFor();
    check('lost response retry returns identical persisted event', replay.replayed && replay.event.eventId === lost.event.eventId);
    await own.screenshot({ path: output + '/real-player-retry.png' });
    const forbidden = await fetch(base + roomPath + '/runtime/dnd-attack', { method: 'POST', headers: { 'content-type': 'application/json', 'x-dev-user-id': 'clarity-player' }, body: JSON.stringify({ memberId: player.memberId, intentId: crypto.randomUUID(), actorCombatantId: 'clarity-npc', targetCombatantId: 'clarity-pc', actionId: 'clarity-strike', mode: 'normal' }) });
    check('real server denies player control of NPC', forbidden.status === 403);
    const spectator = await api('/rooms/join', { inviteCodeOrRoomCode: room.identity.roomCode, requestedDisplayName: 'Clarity Spectator', requestedRole: 'spectator' }, 'clarity-spectator');
    await api(`${roomPath}/members/${spectator.memberId}/approve`, { decidedByMemberId: hostMember });
    const observer = await open(spectator.memberId, 'clarity-spectator', 'spectator');
    await observer.getByRole('button', { name: '进入跑团桌面', exact: true }).click();
    await observer.locator('[data-live-play=spectator]').waitFor();
    check('real spectator has no attack controls', await observer.locator('[data-live-attack]').count() === 0);
    const log = await api(roomPath + '/runtime-log?memberId=' + hostMember);
    check('three deliberate attacks persisted exactly once each', log.events.filter(e => e.kind === 'combat.attack_resolved').length === 3);
    await own.reload();
    await own.getByRole('button', { name: '进入跑团桌面', exact: true }).click();
    await own.locator('[data-live-attack]').waitFor();
    check('player can reload and re-enter accepted character', (await own.locator('[data-attack-summary]').innerText()).includes('Clarity Hero'));
    const result = { status: 'passed', kind: 'real PostgreSQL + compiled backend + separate localDev browser identities', checks, roomId: room.identity.roomId, hostMember, playerMember: player.memberId, eventIds: log.events.map(e => e.eventId), latestSeq: log.latestSeq };
    await fs.writeFile(output + '/real-browser-results.json', JSON.stringify(result, null, 2) + '\n');
    return result;
  } finally { await Promise.all(contexts.map(c => c.close())); }
}
