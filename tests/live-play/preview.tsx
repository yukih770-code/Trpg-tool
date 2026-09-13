/// <reference types="vite/client" />
import { installJourneyFixtures } from '../user-journey/fixtures';
import { JoinCampaignPanel } from '../../src/components/platform/JoinCampaignPanel';
/** Development-only rendered integration fixture. No real room or account writes. */
import { installIaFixtures } from '../product-ia/fixtures';
import { PersonalContentHub } from '../../src/components/platform/PersonalContentHub';
import { DocumentLibraryShell } from '../../src/components/platform/DocumentLibraryShell';
import { BasicMapBoard } from '../../src/components/platform/BasicMapBoard';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { RoomRuntimeEntryBridge } from '../../src/components/platform/RoomRuntimeEntryBridge';
import { ServerCampaignWorkspace } from '../../src/components/platform/ServerCampaignWorkspace';
import { campaignRoomApiClient } from '../../src/lib/api/campaignRoomApiClient';
import { RoomLobbyShell } from '../../src/components/platform/RoomLobbyShell';
import { createCombatant } from '../../src/lib/combat/combatRuntimeTypes';
import type { RoomSnapshot } from '../../src/lib/platform/roomTypes';
import type { RoomRuntimeEntryContext } from '../../src/lib/platform/roomRuntimeEntryTypes';
if (!import.meta.env.DEV) throw new Error('Development fixture only');
const params = new URLSearchParams(location.search);
const role = params.get('role') === 'host' ? 'host' : params.get('role') === 'spectator' ? 'spectator' : 'player';
const exploration = params.has('exploration');
const systemId = params.has('custom') ? 'custom' : 'dnd5e-2024';
const baseUrl = location.origin + '/ux-fixture';
const names = ['艾拉 · 游侠', '索恩 · 战士', '米拉 · 牧师', '地精斥候', '地精弓手', '熊地精'];
const combatants = names.map((name, i) => createCombatant({ id: 'c'+i, displayName: name, kind: i<3 ? 'character' : 'npc',
 sourceActorInstanceId:'actor'+i, mapTokenId:'t'+i, initiative:20-i*2, initiativeModifier:2, hpCurrent:i===0?24:18, hpMax:i===0?28:18, armorClass:15, temporaryHp:i===3?4:0,
 conditions:i===5?['倒地']:[], hpDisplay:{kind:'exact',current:i===0?24:18,max:i===0?28:18,temporary:i===3?4:0}, acDisplay:{kind:'exact',value:15}, visibility:'publicShared',relation:i===0?'self':i<3?'ally':'enemy' }));
const room:RoomSnapshot = { actorBindings:[], invites:[], identity:{roomId:'ux-room',roomCode:'MOON12',serverId:'ux',sessionId:'ux-session',systemId,lifecycleStatus:'open',displayName:'月影要塞'},
 joinApprovalMode:'hostApprovalRequired', members:[{memberId:'host',userId:'host-user',displayName:'林 · 主持人',role:'host',status:'active'}, ...names.slice(0,3).map((name,i)=>({memberId:'p'+i,userId:'u'+i,displayName:['小雨','阿冬','小米'][i],role:'player' as const,status:'active' as const})),{memberId:'spectator',displayName:'旁观者',role:'spectator',status:'active'}],
 lobby:{actorBindings:names.slice(0,3).map((name,i)=>({bindingId:'b'+i,memberId:'p'+i,status:'approved' as const,submittedAt:'2026-09-10T09:00:00Z',campaignActorInstanceId:'actor'+i,actorRef:{systemId,displayName:name,source:'quickDraft' as const,hpCurrent:i===0?24:18,hpMax:i===0?28:18,armorClass:15}})), readyStates:names.slice(0,3).map((_,i)=>({memberId:'p'+i,status:'ready' as const,updatedAt:'2026-09-10T09:00:00Z'}))},
 campaignRef:{campaignId:'ux-campaign',worldServerId:'ux-world',displayName:'月影要塞',systemId,source:'unknown'} };
const memberId=role==='player'?'p0':role;
const context:RoomRuntimeEntryContext={roomId:'ux-room',roomCode:'MOON12',systemId,serverBaseUrl:baseUrl,currentMemberId:memberId,currentRole:role,entryMode:role==='host'?'hostPreview':role==='spectator'?'spectatorPreview':'playerReady',approvedActorBindingId:role==='player'?'b0':undefined,actorRef:role==='player'?room.lobby!.actorBindings[0].actorRef:undefined,campaignRef:room.campaignRef};
let sequence=0;
const makeEvent=(kind:string,payload:unknown,text?:string)=>({eventId:'e'+(++sequence),roomId:'ux-room',seq:sequence,kind,visibility:'public',createdAt:'2026-09-10T09:22:00Z',authorMemberId:'host',payload,text});
const events:any[]=[makeEvent('host.note',{noteKind:'sceneFocus',title:'月影要塞 · 东门',body:'雨声掩盖了守卫的脚步。断桥另一端传来火光。'},'抵达东门'),
 ...(!exploration?[makeEvent('combat.started',{combatants,roundNumber:3,turnIndex:0,activeCombatantId:'c0'},'遭遇战开始')]:[]),
 {...makeEvent('chat.message',undefined,'我绕到桥侧，留意弓手。'),authorMemberId:'p1'},
 makeEvent('host.note',{noteKind:'publicInfo',title:'断桥',body:'北侧石台可提供掩护。'},'北侧石台可提供掩护。')];
const maps:any[]=[{mapEventId:'m0',seq:1,eventKind:'map.background_set',payload:{backgroundPreset:'dark_dungeon'}},...combatants.map((c,i)=>({mapEventId:'m'+(i+1),seq:i+2,eventKind:'map.token_added',payload:{token:{id:'t'+i,name:c.displayName,displayName:c.displayName,x:[35,30,38,61,67,62][i],y:[48,62,69,40,53,67][i],size:'medium',kind:i<3?'playerCharacter':'monster',sourceType:'campaign_actor',combatantId:c.id,sourceCombatantId:c.id,sourceActorInstanceId:'actor'+i,actorBindingId:i<3?'b'+i:undefined,roomMemberId:i<3?'p'+i:undefined,hpDisplay:c.hpDisplay,acDisplay:c.acDisplay,relation:c.relation,visibility:'publicShared',colorLabel:i<3?'#4e9986':'#bd6b51'}}}))].map(e=>({...e,mapId:'room:ux-room',roomId:'ux-room',createdAt:'2026-09-10T09:00:00Z'}));
const sockets:FixtureSocket[]=[];
class FixtureSocket extends EventTarget {
 static CONNECTING=0; static OPEN=1; static CLOSING=2; static CLOSED=3; readyState=0;
 onopen:any; onmessage:any; onclose:any; onerror:any;
 constructor(public url:string){super();sockets.push(this);setTimeout(()=>{this.readyState=1;this.onopen?.({});},15);}
 send(raw:string){const m=JSON.parse(raw);if(m.type==='subscribeRoom'){this.deliver({type:'subscribedRoom',roomId:'ux-room',runtimeLogLatestSeq:sequence,mapEventLatestSeq:maps.length});this.deliver({type:'roomSnapshot',roomId:'ux-room',payload:{room},serverSeq:1});}}
 deliver(data:any){this.onmessage?.({data:JSON.stringify({protocolVersion:'room-ws-v0',messageId:'fixture',sentAt:new Date().toISOString(),...data})});}
 close(){this.readyState=3;this.onclose?.({});}
}
window.WebSocket=FixtureSocket as any;
const emit=(event:any)=>sockets.filter(s=>s.readyState===1).forEach(s=>s.deliver({type:'runtimeLogAppended',roomId:'ux-room',events:[event],latestSeq:sequence}));
const originalFetch=window.fetch.bind(window);
const intents:any[]=[]; const results=new Map<string,any>(); let failed=false;
(window as any).uxFixture={intents,events,emit,room};
window.fetch=async(input,init)=>{
 const url=new URL(String(input),location.href);
 if(!url.pathname.startsWith('/ux-fixture')) return originalFetch(input,init);
 const body=init?.body?JSON.parse(String(init.body)):undefined;
 const reply=(data:any,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(url.pathname.endsWith('/runtime/dnd-actions')) return reply({actions:params.has('empty')?[]:[{id:'longbow',name:url.searchParams.get('actorCombatantId')==='c0'?'长弓':'短剑',kind:'weapon_attack',attackBonus:5,damageFormula:'1d8+3',damageType:'piercing'}]});
 if(url.pathname.endsWith('/runtime-actors')) return reply({persistence:'available',actors:room.lobby!.actorBindings.map((b,i)=>({bindingId:b.bindingId,campaignActorInstanceId:'actor'+i,displayName:b.actorRef.displayName,systemId,actorKind:'pc',hpCurrent:i===0?24:18,hpMax:i===0?28:18,temporaryHp:0,armorClass:15,source:'campaignOverride'}))});
 if(url.pathname.endsWith('/runtime/dnd-attack')){
  intents.push(body); const prior=results.get(body.intentId);
  if(prior) return reply({event:prior,replayed:true});
  const target={...combatants.find(c=>c.id===body.targetCombatantId)!,hpCurrent:13,hpDisplay:{kind:'exact',current:13,max:18,temporary:0},temporaryHp:0};
  const event=makeEvent('combat.attack_resolved',{actorCombatantId:body.actorCombatantId,targetCombatantId:body.targetCombatantId,combatants:combatants.map(c=>c.id===target.id?target:c),resolution:{mode:body.mode,attackRawRolls:body.mode==='advantage'?[18,7]:[18],attackKeptRoll:18,attackBonus:5,attackTotal:23,outcome:'hit',damageFormula:'1d8+3',damageRawRolls:[[6]],damageTotal:9,damageType:'piercing'},privileged:{targetAc:15,beforeHp:18,afterHp:13,beforeTemporaryHp:4,afterTemporaryHp:0,absorbedByTemporaryHp:4,amount:5}},'攻击命中，掷出 9 点穿刺伤害。');
  results.set(body.intentId,event);events.push(event);emit(event);
  if(params.has('retry')&&!failed){failed=true;return reply({error:'测试：响应丢失，请重试同一攻击。'},503);}
  return reply({event,replayed:false});
 }
 if(url.pathname.endsWith('/runtime-log/events')){const event={...makeEvent(body.kind,body.payload,body.text),authorMemberId:body.authorMemberId};events.push(event);emit(event);return reply({event});}
 if(url.pathname.endsWith('/runtime-log')) return reply({events:events.filter(e=>e.seq>Number(url.searchParams.get('afterSeq')??0)),latestSeq:sequence});
 if(url.pathname.endsWith('/map-events')) return reply({events:maps,latestSeq:maps.length});
 if(url.pathname.endsWith('/ux-room')) return reply(room);
 return reply({});
};
const campaignFixture={campaign:{campaignId:'ux-campaign',ownerId:'host-user',title:'月影要塞',description:'穿过雨中的山道，调查要塞失踪的守卫。',systemId:'custom',status:'active',lifecycleStatus:'active',payload:{},schemaVersion:1},binding:{bindingId:'ux-binding',worldServerId:'ux-world',campaignId:'ux-campaign',bindingKind:'hosted',visibilityScope:'server',payload:{}}};
const roomRecord={roomId:'ux-room',campaignId:'ux-campaign',roomCode:'MOON12',hostUserId:'host-user',multiplayerMode:'cloud',roomStatus:'open',status:'open',lifecycleStatus:'open',metadata:{name:'月影要塞 · 周五晚',liveRoomLifecycleV1:{recoverable:true}},schemaVersion:1};
if(params.has('workspace')) Object.assign(campaignRoomApiClient,{listCampaigns:async()=>[campaignFixture],getCampaign:async()=>campaignFixture,listCampaignActors:async()=>[],listRooms:async()=>[roomRecord],getRoom:async()=>roomRecord,listRoomParticipants:async()=>[],listLobbySlots:async()=>[],getRuntimeSession:async()=>null,listRuntimeEvents:async()=>[]});
installIaFixtures({params,room,maps,combatants,campaignFixture,roomRecord,baseUrl,sockets});
installJourneyFixtures({params,room,sockets,campaignFixture});
function Preview(){const [lobby,setLobby]=useState(params.has('lobby'));return params.has('journey-join') ? <JoinCampaignPanel systemId='dnd5e-2024' /> : params.has('documents') ? <DocumentLibraryShell locale='zh-CN' onBack={()=>{}} /> : params.has('personal') ? <PersonalContentHub locale='zh-CN' /> : params.has('map-workspace') ? <BasicMapBoard locale='zh-CN' mapId='fixture-map' mapEvents={[]} combatants={combatants} canManage onAppendEvent={async event=>{(window as any).iaFixture.writes.push({kind:'workspace-map.append',body:event});}} /> : params.has('workspace')?<div style={{padding:24,maxWidth:1400,margin:'auto'}}><ServerCampaignWorkspace worldServerId='ux-world' locale='zh-CN' gameSystems={[]} defaultGameSystemId={params.has('ia')?'dnd5e-2024':'custom'} canManageServer={!params.has('readonly')} viewerUserId='host-user' /></div>:lobby?<div style={{padding:24,maxWidth:1280,margin:'auto'}}><RoomLobbyShell baseUrl={baseUrl} roomId="ux-room" currentMemberId={memberId} currentRole={role} initialRoom={room} onEnterRuntime={()=>setLobby(false)} /></div>:<RoomRuntimeEntryBridge context={context} room={room} onBackToLobby={()=>setLobby(true)} />;}
createRoot(document.getElementById('root')!).render(<Preview />);
