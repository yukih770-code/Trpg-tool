import { useCharacterStore } from '../../src/store/characterStore';
import { migrateCharacter } from '../../src/lib/characterMigration';
import { dndMonsterTemplateApiClient } from '../../src/lib/api/dndMonsterTemplateApiClient';
export function installJourneyFixtures({ params, room, sockets, campaignFixture }: any) {
  if (!params.has('journey')) return;
  if(params.has('custom')) campaignFixture.campaign.systemId='custom';
  const store=useCharacterStore;
  const blank=migrateCharacter({id:'journey-draft',name:'',level:1});
  store.setState({character:blank,characters:[blank],activeCharacterId:blank.id});
  const ready=()=>{const c=store.getState().character;return {...c,name:'旅途勇者',race:'人类',background:'士兵',jobClass:'战士',feats:['警觉'],remainingPoints:0,attrs:Object.fromEntries(Object.entries(c.attrs).map(([k,v]:any)=>[k,{...v,pointbuy:({Str:7,Dex:5,Con:5,Int:3,Wis:3,Cha:2} as any)[k]}]))};};
  if(params.has('existing')) store.getState().commitCompletedCharacter({...ready(),id:'existing-hero',isCompleted:true});
  room.lobby.actorBindings=room.lobby.actorBindings.filter((b:any)=>b.memberId!=='p0');
  room.lobby.readyStates=room.lobby.readyStates.filter((r:any)=>r.memberId!=='p0');
  const writes:any[]=[],cloud:any[]=[];
  const broadcast=()=>sockets.filter((s:any)=>s.readyState===1).forEach((s:any)=>s.deliver({type:'roomSnapshot',roomId:'ux-room',payload:{room},serverSeq:20}));
  const state={writes,cloud,room,savedCharacters:()=>store.getState().characters,fillReady:()=>store.getState().loadCharacter(ready()),character:()=>store.getState().character,
    approve:()=>{const b=room.lobby.actorBindings.find((b:any)=>b.memberId==='p0');b.status='approved';b.clearance={status:'approved',admissionId:'admitted-player'};broadcast();}};
  (window as any).journeyFixture=state;
  Object.assign(dndMonsterTemplateApiClient,{list:async()=>[{monsterTemplateId:'catalog-goblin',worldServerId:'ux-world',slug:'catalog-goblin',visibility:'private',schemaVersion:1,name:'资料库地精',creatureType:'类人生物',challengeRating:'1/4',armorClass:15,hitPointsAverage:7,speed:{walk:'30 ft'},abilities:{},savingThrows:{},skills:{},senses:{},traits:[],actions:[],reactions:[],legendaryActions:[],tags:[]}]});
  const previous=window.fetch.bind(window);
  const reply=(v:any)=>new Response(JSON.stringify(v),{status:200,headers:{'Content-Type':'application/json'}});
  const api=(value:any)=>reply({ok:true,statusCode:200,value});
  window.fetch=async(input,init)=>{
    const url=new URL(String(input),location.href),body=init?.body?JSON.parse(String(init.body)):undefined;
    if(url.pathname.endsWith('/api/actors')){
      if(init?.method==='POST'){const actor={...body,actorId:'cloud-'+cloud.length,ownerId:'journey-user',schemaVersion:1};cloud.push(actor);writes.push({kind:'vault.create',body});return api(actor);}
      return api(cloud);
    }
    if(url.pathname.includes('/api/personal-'))return api([]);
    if(url.pathname.endsWith('/health'))return reply({ok:true});
    if(url.pathname.endsWith('/rooms')&&!init?.method)return reply([]);
    if(url.pathname.endsWith('/rooms/join')){
      writes.push({kind:'join',body});const memberId=body.requestedRole==='spectator'?'spectator':'p0';
      return reply({decision:'accepted',roomId:'ux-room',memberId,assignedRole:body.requestedRole??'player'});
    }
    if(url.pathname.endsWith('/actor-bindings/submit')){
      writes.push({kind:'binding.submit',body});
      room.lobby.actorBindings=room.lobby.actorBindings.filter((b:any)=>b.memberId!==body.memberId);
      room.lobby.actorBindings.push({bindingId:'submitted-'+body.memberId,memberId:body.memberId,status:'pending',actorRef:body.actorRef,submittedAt:new Date().toISOString(),clearance:{status:'pending'}});
      room.lobby.readyStates=room.lobby.readyStates.filter((r:any)=>r.memberId!==body.memberId);broadcast();return reply({});
    }
    if(url.pathname.endsWith('/ready')){
      writes.push({kind:'ready',body});room.lobby.readyStates.push({memberId:'p0',status:body.ready?'ready':'notReady'});broadcast();return reply({});
    }
    if(url.pathname.endsWith('/ux-room'))return reply(room);
    return previous(input,init);
  };
}
