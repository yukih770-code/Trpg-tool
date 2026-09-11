import { campaignRoomApiClient, type CampaignActorInstance } from '../../src/lib/api/campaignRoomApiClient';
import { createDefaultDndLiteActorSheet } from '../../src/lib/dnd/dndLiteActorSheet';
import { withDndLiteActorSheetOverride } from '../../src/lib/platform/campaignActorOverride';
import { dndMonsterTemplateApiClient } from '../../src/lib/api/dndMonsterTemplateApiClient';

// Deterministic transport for the real campaign → lobby → live component tree.
// No real account, room or persistence operation is performed.
export function installIaFixtures({ params, room, maps, combatants, campaignFixture, roomRecord, baseUrl, sockets }: any) {
  if (!params.has('ia')) return;
  const clone = <T,>(value: T): T => structuredClone(value);
  campaignFixture.campaign.systemId = 'dnd5e-2024';
  const actors: CampaignActorInstance[] = combatants.map((c: any, i: number) => {
    const sheet = createDefaultDndLiteActorSheet({ displayName: c.displayName, actorKind: i < 3 ? 'pc' : 'monster' });
    sheet.defenses = { armorClass: 15, currentHp: 18, maxHp: 18 };
    sheet.actions = [{ id: 'longbow', name: '长弓', kind: 'weapon_attack', attackBonus: 5, damageFormula: '1d8+3', damageType: 'piercing' }];
    return { campaignActorInstanceId: 'actor'+i, campaignId: 'ux-campaign', displayName: c.displayName, actorKind: i < 3 ? 'pc' : 'monster', instanceStatus: 'active', snapshotPayload: {}, overridePayload: withDndLiteActorSheetOverride({}, sheet) };
  });
  const writes: any[] = [];
  const campaigns = params.has('new') ? [] : [campaignFixture];
  const rooms = params.has('new') ? [] : [roomRecord];
  const state = { actors, writes, campaigns, rooms, failSave: false, holdNextRead: false, releaseRead: undefined as undefined | (() => void), setServerAc: (id: string, ac: number) => {
    const actor=actors.find(a=>a.campaignActorInstanceId===id)!;
    const sheet:any=Object.values(actor.overridePayload).find((v:any)=>v?.defenses);
    sheet.defenses.armorClass=ac;
  }};
  (window as any).iaFixture = state;
  Object.assign(campaignRoomApiClient, {
    listCampaigns: async () => clone(campaigns),
    createCampaign: async (_w: any, input: any) => { Object.assign(campaignFixture.campaign,input); campaigns.push(campaignFixture); writes.push({kind:'campaign.create',input}); return clone(campaignFixture); },
    getCampaign: async () => clone(campaignFixture),
    listCampaignActors: async () => { const snapshot=clone(actors); if(state.holdNextRead){state.holdNextRead=false;await new Promise<void>(resolve=>{state.releaseRead=resolve;});}return snapshot; },
    listRooms: async () => clone(rooms),
    createRoom: async () => { rooms.push(roomRecord); writes.push({kind:'room.create'}); return clone(roomRecord); },
    getRoom: async () => clone(roomRecord),
    listRoomParticipants: async () => [],
    listLobbySlots: async () => [],
    getRuntimeSession: async () => ({session:{runtimeSessionId:'ux-session',campaignId:'ux-campaign',status:'active',payload:{},schemaVersion:1},binding:null}),
    listRuntimeEvents: async () => [],
    listSceneStates: async () => [],
    updateCampaignActor: async (_w: string, _c: string, id: string, input: any) => {
      writes.push({kind:'actor.update',id,input:clone(input)});
      if(state.failSave)throw new Error('Fixture save failed');
      const actor=actors.find(a=>a.campaignActorInstanceId===id)!; Object.assign(actor,clone(input));return clone(actor);
    },
    createCampaignActor: async (_w: string, _c: string, input: any) => {
      const actor={campaignActorInstanceId:'created-'+actors.length,campaignId:'ux-campaign',instanceStatus:'active',snapshotPayload:{},overridePayload:{},...input};
      actors.push(actor);writes.push({kind:'actor.create',actor:clone(actor)});return clone(actor);
    }
  });
  Object.assign(dndMonsterTemplateApiClient,{list:async()=>[]});
  const previousFetch=window.fetch;
  window.fetch=async(input,init)=>{
    const url=new URL(String(input),location.href);
    const body=init?.body?JSON.parse(String(init.body)):undefined;
    const reply=(v:any)=>new Response(JSON.stringify(v),{status:200,headers:{'Content-Type':'application/json'}});
    if(url.pathname.endsWith('/ux-room/entry'))return reply({room,memberId:'host',role:'host'});
    if(url.pathname.endsWith('/rooms/create')){writes.push({kind:'room.launch',body});return reply({room});}
    if(url.pathname.includes('monster'))return reply({monsters:[]});
    if(url.pathname.endsWith('/map-events')&&init?.method==='POST'){
      const event={...body,mapEventId:'ia-map-'+maps.length,roomId:'ux-room',mapId:'room:ux-room',seq:maps.length+1,createdAt:new Date().toISOString()};
      maps.push(event);writes.push({kind:'map.append',body});
      sockets.filter((s:any)=>s.readyState===1).forEach((s:any)=>s.deliver({type:'mapEventsAppended',roomId:'ux-room',events:[event],latestSeq:maps.length}));
      return reply({event});
    }
    return previousFetch(input,init);
  };
}
