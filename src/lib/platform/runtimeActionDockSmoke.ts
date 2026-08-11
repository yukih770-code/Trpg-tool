import { buildRuntimeDockActions, splitRuntimeDockActionsForMobile } from '../../components/platform/RuntimeActionDock';

const checks: string[] = [];
function check(name: string, condition: boolean): void {
  if (!condition) throw new Error(`failed: ${name}`);
  checks.push(name);
}

const host = buildRuntimeDockActions('host', 'dice', {
  publicInfoPanel: 'public', stateLogPanel: 'state', scenePanel: 'scene', privateNotesPanel: 'notes',
}, 'coc7e');
const hostMobile = splitRuntimeDockActionsForMobile(host);
check('host keeps dice, scene, and public information direct', hostMobile.direct.map((action) => action.id).join(',') === 'dice,scene,publicInfo');
check('host moves records and private notes into More', hostMobile.overflow.map((action) => action.id).join(',') === 'stateLog,keeperNotes');

const dndPlayer = buildRuntimeDockActions('player', 'dice', {
  publicInfoPanel: 'public', actorPanel: 'actor', dndActionPanel: 'actions',
}, 'dnd5e-2024');
const dndPlayerMobile = splitRuntimeDockActionsForMobile(dndPlayer);
check('DND player prioritizes actions before dice and actor', dndPlayerMobile.direct.map((action) => action.id).join(',') === 'dndActions,dice,actor');
check('DND player keeps public information in More', dndPlayerMobile.overflow.map((action) => action.id).join(',') === 'publicInfo');

const dndPlayerWithoutPalette = splitRuntimeDockActionsForMobile(buildRuntimeDockActions('player', 'dice', {
  publicInfoPanel: 'public', actorPanel: 'actor',
}, 'dnd5e-2024'));
check('DND public information stays direct when no action palette exists', dndPlayerWithoutPalette.direct.map((action) => action.id).join(',') === 'dice,actor,publicInfo');

const spectatorMobile = splitRuntimeDockActionsForMobile(buildRuntimeDockActions('spectator', 'unused', { publicInfoPanel: 'public' }));
check('spectator keeps public information as the sole primary action', spectatorMobile.direct.length === 1 && spectatorMobile.direct[0]?.id === 'publicInfo' && spectatorMobile.overflow.length === 0);

const localHostWithUtilities = [...host, { id: 'actor', label: 'Actor', panel: 'actor' }, { id: 'settings', label: 'Settings', panel: 'settings' }];
const localHostMobile = splitRuntimeDockActionsForMobile(localHostWithUtilities);
check('caller-added utilities default safely into More', localHostMobile.overflow.slice(-2).map((action) => action.id).join(',') === 'actor,settings');
check('mobile split preserves every action exactly once', new Set([...localHostMobile.direct, ...localHostMobile.overflow].map((action) => action.id)).size === localHostWithUtilities.length);
check('compact direct row never exceeds three actions', localHostMobile.direct.length <= 3);

console.log(JSON.stringify({ total: checks.length, passed: checks.length, failed: 0, checks }, null, 2));
