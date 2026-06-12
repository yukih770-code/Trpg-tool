import React, { useState } from 'react';
import { Creator } from './Creator';
import { Sheet } from './Sheet';
import { Gameplay } from './Gameplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useCharacterStore } from '../store/characterStore';
import { useAppStore } from '../store/appStore';
import { Save, Upload } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

import { ModManager } from '../components/ModManager';

import { CocCreator } from './CocCreator';
import { CocSheet } from './CocSheet';
import { CocGameplay } from './CocGameplay';
import { useCocStore } from '../store/cocStore';

import { CpCreator } from './CpCreator';
import { CpSheet } from './CpSheet';
import { CpGameplay } from './CpGameplay';
import { CpMarket } from './CpMarket';
import { useCpStore } from '../store/cpStore';
import {
  createCharacterExportEnvelope,
  parseCharacterImportJson,
  platformSystemToExportSystem,
  type PlatformRulesetSystem,
} from '../lib/data-contract/export-envelope';

// ── Decorative SVG Backgrounds ────────────────────────────

/** D&D — parchment fantasy: dragon, d20, crossed swords, corner ornaments */
function DndBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none"
         viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">

      {/* Large D20 — bottom-right watermark */}
      <g transform="translate(730,490)" fill="none" stroke="#58180d" strokeWidth="2" opacity="0.09">
        {/* Outer pentagon (d20 top-vertex orientation) */}
        <polygon points="0,-130 124,40 76,108 -76,108 -124,40"/>
        {/* Main upper triangle */}
        <polygon points="0,-130 124,40 -124,40"/>
        {/* Center vertical */}
        <line x1="0" y1="-130" x2="0" y2="108"/>
        {/* Lower face diagonals */}
        <line x1="-124" y1="40" x2="0" y2="108"/>
        <line x1="124"  y1="40" x2="0" y2="108"/>
        {/* Inner horizontal */}
        <line x1="-76" y1="108" x2="76" y2="108"/>
      </g>

      {/* Crossed swords — upper-left */}
      <g transform="translate(125,125)" fill="none" stroke="#58180d" strokeWidth="2.5" opacity="0.08">
        {/* Blade 1 (top-left → bottom-right) */}
        <line x1="-75" y1="-75" x2="75" y2="75"/>
        {/* Guard 1 */}
        <line x1="-18" y1="-75" x2="-75" y2="-18"/>
        {/* Pommel 1 */}
        <circle cx="75" cy="75" r="5" fill="#58180d"/>
        {/* Blade 2 (top-right → bottom-left) */}
        <line x1="75" y1="-75" x2="-75" y2="75"/>
        {/* Guard 2 */}
        <line x1="18" y1="-75" x2="75" y2="-18"/>
        {/* Pommel 2 */}
        <circle cx="-75" cy="75" r="5" fill="#58180d"/>
      </g>

      {/* Dragon silhouette — upper-right */}
      <g transform="translate(610,90)" fill="#58180d" stroke="none" opacity="0.055">
        {/* Body */}
        <ellipse cx="60" cy="65" rx="85" ry="38"/>
        {/* Neck */}
        <path d="M130,55 Q155,40 175,50 Q165,65 145,70 Q135,68 130,60 Z"/>
        {/* Head */}
        <ellipse cx="200" cy="55" rx="32" ry="22"/>
        {/* Snout */}
        <path d="M225,50 L255,53 L238,66 Z"/>
        {/* Jaw lower */}
        <path d="M215,65 L248,70 L235,78 L210,72 Z"/>
        {/* Horn */}
        <path d="M190,38 L196,12 L203,36 Z"/>
        {/* Eye spot */}
        <circle cx="205" cy="50" r="4" fill="#fdf6e3" opacity="0.4"/>
        {/* Upper wing */}
        <path d="M55,35 C35,5 -10,-25 -55,-10 C-45,15 -20,20 5,28 C20,25 40,28 55,35 Z"/>
        {/* Wing membrane line */}
        <path d="M55,35 C40,55 20,68 -5,72 C10,68 30,58 55,35 Z"/>
        {/* Lower wing */}
        <path d="M55,95 C30,115 -15,125 -50,112 C-35,100 -10,95 20,95 C35,95 47,95 55,95 Z"/>
        {/* Tail */}
        <path d="M-25,75 C-55,88 -90,92 -115,82 C-95,72 -65,72 -35,72 Z"/>
        <path d="M-115,82 C-135,88 -148,80 -140,68 C-132,65 -120,70 -115,82 Z"/>
        {/* Legs */}
        <path d="M30,100 L22,130 L35,132 L28,105 Z"/>
        <path d="M80,100 L74,130 L87,130 L82,104 Z"/>
        {/* Claws */}
        <path d="M18,130 L12,140 M22,130 L20,141 M35,132 L38,142"/>
      </g>

      {/* Shield crest — top-center */}
      <g transform="translate(450,58)" fill="none" stroke="#58180d" strokeWidth="1.5" opacity="0.065">
        <path d="M0,-48 L48,-30 L48,18 C48,48 0,66 0,66 C0,66 -48,48 -48,18 L-48,-30 Z"/>
        <line x1="0" y1="-48" x2="0" y2="66"/>
        <line x1="-48" y1="0" x2="48" y2="0"/>
        {/* Fleur-de-lis hint */}
        <path d="M0,-28 C-6,-22 -6,-12 0,-8 C6,-12 6,-22 0,-28 Z"/>
      </g>

      {/* Corner ornaments — four corners */}
      <g fill="none" stroke="#58180d" strokeWidth="1.5" opacity="0.08">
        {/* TL */}
        <path d="M15,15 L15,55 M15,15 L55,15"/>
        <path d="M25,15 L15,25 M15,35 L35,15"/>
        <circle cx="15" cy="15" r="3.5" fill="#58180d"/>
        {/* TR */}
        <path d="M885,15 L885,55 M885,15 L845,15"/>
        <path d="M875,15 L885,25 M885,35 L865,15"/>
        <circle cx="885" cy="15" r="3.5" fill="#58180d"/>
        {/* BL */}
        <path d="M15,635 L15,595 M15,635 L55,635"/>
        <circle cx="15" cy="635" r="3.5" fill="#58180d"/>
        {/* BR */}
        <path d="M885,635 L885,595 M885,635 L845,635"/>
        <circle cx="885" cy="635" r="3.5" fill="#58180d"/>
      </g>

      {/* Subtle horizontal rule */}
      <line x1="60" y1="325" x2="840" y2="325" stroke="#58180d" strokeWidth="1" opacity="0.035" strokeDasharray="4 8"/>
    </svg>
  );
}

/** CoC — eldritch horror: Cthulhu silhouette, Elder Sign, tentacles, stars */
function CocBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none"
         viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">

      {/* Elder Sign — five-pointed star with concentric rings, center */}
      <g transform="translate(450,310)" fill="none" stroke="#059669" strokeWidth="1.5" opacity="0.055">
        {/* Outer ring */}
        <circle r="200"/>
        <circle r="155"/>
        <circle r="110"/>
        {/* Five-pointed star (pentagram) */}
        <polygon points="0,-155 47,-64 147,-47 90,35 115,129 0,75 -115,129 -90,35 -147,-47 -47,-64"
                 strokeWidth="1.5" fill="none"/>
        {/* Inner pentagon */}
        <polygon points="0,-60 57,-18 35,47 -35,47 -57,-18"/>
        {/* Eye in center */}
        <ellipse rx="28" ry="18" fill="none" strokeWidth="2"/>
        <ellipse rx="12" ry="12" fill="#059669" opacity="0.25"/>
        <circle r="5" fill="#059669" opacity="0.5"/>
      </g>

      {/* Cthulhu / deep one silhouette — center bottom */}
      <g transform="translate(450,590)" fill="#059669" stroke="none" opacity="0.045">
        {/* Mantle / robe */}
        <path d="M0,-180 C-60,-170 -100,-140 -120,-90 C-140,-40 -135,20 -110,60
                 C-80,100 -40,115 0,118 C40,115 80,100 110,60
                 C135,20 140,-40 120,-90 C100,-140 60,-170 0,-180 Z"/>
        {/* Head */}
        <ellipse cx="0" cy="-200" rx="55" ry="45"/>
        {/* Tentacles on face */}
        <path d="M-45,-195 C-65,-210 -75,-230 -65,-248 C-55,-240 -50,-225 -45,-210 Z"/>
        <path d="M-25,-205 C-35,-225 -30,-248 -15,-258 C-10,-245 -15,-228 -20,-215 Z"/>
        <path d="M0,-210 C0,-235 5,-258 15,-268 C18,-252 15,-235 10,-220 Z"/>
        <path d="M20,-208 C30,-228 38,-248 52,-255 C50,-240 43,-225 35,-212 Z"/>
        <path d="M42,-195 C58,-210 70,-228 64,-248 C56,-240 52,-222 45,-208 Z"/>
        {/* Wings */}
        <path d="M-80,-120 C-120,-100 -160,-60 -170,-10 C-155,-5 -135,-30 -115,-65
                 C-100,-80 -90,-100 -80,-120 Z"/>
        <path d="M80,-120 C120,-100 160,-60 170,-10 C155,-5 135,-30 115,-65
                 C100,-80 90,-100 80,-120 Z"/>
      </g>

      {/* Tentacles — bottom-left corner */}
      <g fill="none" stroke="#059669" strokeWidth="2" opacity="0.07">
        <path d="M0,650 C15,600 25,545 8,490 C-5,445 12,400 30,365"/>
        <path d="M45,650 C55,605 42,555 22,510 C5,470 22,428 40,395"/>
        <path d="M90,650 C85,615 75,575 92,535 C108,498 90,458 70,425"/>
        {/* Sucker dots */}
        <circle cx="12" cy="520" r="3" fill="#059669" opacity="0.5"/>
        <circle cx="35" cy="475" r="2.5" fill="#059669" opacity="0.5"/>
        <circle cx="52" cy="440" r="2" fill="#059669" opacity="0.5"/>
      </g>

      {/* Tentacles — bottom-right corner */}
      <g fill="none" stroke="#059669" strokeWidth="2" opacity="0.07">
        <path d="M900,650 C885,600 875,545 892,490 C905,445 888,400 870,365"/>
        <path d="M855,650 C845,605 858,555 878,510 C895,470 878,428 860,395"/>
        <path d="M810,650 C815,615 825,575 808,535 C792,498 810,458 830,425"/>
        <circle cx="888" cy="520" r="3" fill="#059669" opacity="0.5"/>
        <circle cx="865" cy="475" r="2.5" fill="#059669" opacity="0.5"/>
        <circle cx="848" cy="440" r="2" fill="#059669" opacity="0.5"/>
      </g>

      {/* Stars — scattered across sky area */}
      {([
        [80,55],[190,35],[310,80],[500,45],[640,70],[770,40],[850,90],
        [130,155],[280,130],[420,170],[570,140],[720,165],[860,135],
        [50,250],[200,230],[380,270],[600,240],[800,260],
        [160,340],[490,310],[730,330],
      ] as [number,number][]).map(([x,y],i) => (
        <g key={i} transform={`translate(${x},${y})`} fill="#059669" opacity="0.12">
          <circle r="1.5"/>
          <line x1="0" y1="-7" x2="0" y2="7"  stroke="#059669" strokeWidth="0.8"/>
          <line x1="-7" y1="0" x2="7" y2="0"  stroke="#059669" strokeWidth="0.8"/>
          <line x1="-5" y1="-5" x2="5" y2="5" stroke="#059669" strokeWidth="0.5"/>
          <line x1="5" y1="-5" x2="-5" y2="5" stroke="#059669" strokeWidth="0.5"/>
        </g>
      ))}

      {/* Old tome — lower-left */}
      <g transform="translate(110,490)" fill="none" stroke="#059669" strokeWidth="1.5" opacity="0.08">
        <rect x="-38" y="-55" width="76" height="100" rx="3"/>
        {/* Spine */}
        <line x1="-18" y1="-55" x2="-18" y2="45"/>
        {/* Pages / lines */}
        <line x1="-38" y1="-20" x2="-18" y2="-20"/>
        <line x1="-38" y1="0"   x2="-18" y2="0"/>
        <line x1="-38" y1="20"  x2="-18" y2="20"/>
        {/* Clasp */}
        <path d="M30,-5 L38,-5 L38,5 L30,5"/>
      </g>
    </svg>
  );
}

/** CP RED — cyberpunk: Night City skyline, circuit traces, cyborg face */
function CpBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none select-none"
         viewBox="0 0 900 650" preserveAspectRatio="xMidYMid slice" aria-hidden="true">

      {/* Night City skyline silhouette — bottom */}
      <g fill="#00e5ff" opacity="0.038">
        {/* Left cluster */}
        <rect x="0"   y="455" width="28"  height="195"/>
        <rect x="23"  y="385" width="22"  height="265"/>
        <rect x="40"  y="415" width="18"  height="235"/>
        <rect x="55"  y="348" width="32"  height="302"/>
        <rect x="83"  y="388" width="24"  height="262"/>
        <rect x="103" y="428" width="18"  height="222"/>
        <rect x="118" y="358" width="38"  height="292"/>
        <rect x="152" y="398" width="28"  height="252"/>
        <rect x="176" y="338" width="18"  height="312"/>
        <rect x="191" y="368" width="42"  height="282"/>
        <rect x="228" y="408" width="22"  height="242"/>
        <rect x="246" y="378" width="28"  height="272"/>
        <rect x="270" y="348" width="48"  height="302"/>
        <rect x="314" y="388" width="18"  height="262"/>
        <rect x="329" y="418" width="26"  height="232"/>
        <rect x="351" y="358" width="22"  height="292"/>
        {/* Center mega-tower */}
        <rect x="392" y="268" width="55"  height="382"/>
        <rect x="407" y="248" width="25"  height="20"/>
        <rect x="412" y="225" width="15"  height="23"/>
        <rect x="416" y="205" width="7"   height="20"/>
        {/* Tower antennae */}
        <line x1="419" y1="205" x2="419" y2="170" stroke="#00e5ff" strokeWidth="2"/>
        <circle cx="419" cy="168" r="3" fill="#00e5ff"/>
        {/* Right cluster */}
        <rect x="495" y="368" width="38"  height="282"/>
        <rect x="528" y="398" width="22"  height="252"/>
        <rect x="546" y="348" width="32"  height="302"/>
        <rect x="574" y="388" width="28"  height="262"/>
        <rect x="598" y="328" width="18"  height="322"/>
        <rect x="613" y="358" width="42"  height="292"/>
        <rect x="651" y="398" width="22"  height="252"/>
        <rect x="669" y="368" width="28"  height="282"/>
        <rect x="694" y="338" width="48"  height="312"/>
        <rect x="738" y="378" width="22"  height="272"/>
        <rect x="756" y="348" width="38"  height="302"/>
        <rect x="790" y="388" width="28"  height="262"/>
        <rect x="814" y="418" width="22"  height="232"/>
        <rect x="833" y="358" width="42"  height="292"/>
        <rect x="870" y="395" width="30"  height="255"/>
      </g>

      {/* Neon sign hints on buildings */}
      <g fill="#f5c518" opacity="0.055">
        <rect x="62"  y="368" width="16" height="4"/>
        <rect x="62"  y="376" width="10" height="4"/>
        <rect x="200" y="358" width="20" height="4"/>
        <rect x="550" y="360" width="18" height="4"/>
        <rect x="615" y="345" width="22" height="4"/>
        <rect x="700" y="355" width="16" height="4"/>
      </g>

      {/* Circuit board traces — top-left corner */}
      <g fill="none" stroke="#00e5ff" strokeWidth="1.2" opacity="0.065">
        <path d="M15,15 L110,15 L110,55 L195,55"/>
        <path d="M195,55 L195,30 L295,30 L295,75 L395,75"/>
        <path d="M110,15 L110,-5"/>
        <path d="M75,75 L75,140 L175,140 L175,110 L275,110"/>
        <path d="M275,110 L275,90 L355,90"/>
        <path d="M75,75 L15,75"/>
        <path d="M175,140 L175,165 L255,165"/>
        {/* IC pads */}
        <rect x="106" y="11"  width="8" height="8" fill="#00e5ff" opacity="0.7"/>
        <rect x="191" y="51"  width="8" height="8" fill="#00e5ff" opacity="0.7"/>
        <rect x="71"  y="71"  width="8" height="8" fill="#00e5ff" opacity="0.7"/>
        <rect x="171" y="136" width="8" height="8" fill="#00e5ff" opacity="0.7"/>
        <rect x="271" y="106" width="8" height="8" fill="#00e5ff" opacity="0.7"/>
      </g>

      {/* Circuit board traces — bottom-right corner */}
      <g fill="none" stroke="#f5c518" strokeWidth="1.2" opacity="0.06">
        <path d="M885,635 L785,635 L785,595 L685,595"/>
        <path d="M685,595 L685,615 L585,615 L585,575 L505,575"/>
        <path d="M785,635 L785,650"/>
        <path d="M825,575 L825,515 L725,515 L725,535 L625,535"/>
        <path d="M625,535 L625,555 L545,555"/>
        <path d="M825,575 L885,575"/>
        <path d="M725,515 L725,495 L645,495"/>
        <rect x="781" y="631" width="8" height="8" fill="#f5c518" opacity="0.7"/>
        <rect x="681" y="591" width="8" height="8" fill="#f5c518" opacity="0.7"/>
        <rect x="821" y="571" width="8" height="8" fill="#f5c518" opacity="0.7"/>
        <rect x="721" y="511" width="8" height="8" fill="#f5c518" opacity="0.7"/>
        <rect x="621" y="531" width="8" height="8" fill="#f5c518" opacity="0.7"/>
      </g>

      {/* Cyborg face silhouette — upper right */}
      <g transform="translate(790,130)" fill="#f5c518" stroke="none" opacity="0.04">
        {/* Skull outline */}
        <path d="M0,-75 C-42,-75 -65,-48 -65,0 C-65,32 -50,55 -28,68 L-28,85 L28,85 L28,68 C50,55 65,32 65,0 C65,-48 42,-75 0,-75 Z"/>
        {/* Left eye socket */}
        <rect x="-45" y="-18" width="30" height="24" rx="4" fill="#0d0d0d"/>
        <ellipse cx="-30" cy="-6" rx="10" ry="9" fill="#f5c518" opacity="0.5"/>
        {/* Right eye — cybernetic ring */}
        <path d="M8,-18 L42,-18 L48,0 L36,6 L8,6 Z" fill="#0d0d0d"/>
        <circle cx="26" cy="-6" r="9" fill="#f5c518" opacity="0.5"/>
        <circle cx="26" cy="-6" r="4"/>
        {/* Nose bridge */}
        <rect x="-6" y="12" width="12" height="18" rx="2"/>
        {/* Jaw / mouth grill */}
        <rect x="-28" y="36" width="56" height="12" rx="2" fill="#0d0d0d"/>
        <rect x="-28" y="36" width="56" height="12" rx="2" fill="none" stroke="#f5c518" strokeWidth="0.8" opacity="0.8"/>
        <line x1="-12" y1="36" x2="-12" y2="48" stroke="#f5c518" strokeWidth="1.5"/>
        <line x1="0"   y1="36" x2="0"   y2="48" stroke="#f5c518" strokeWidth="1.5"/>
        <line x1="12"  y1="36" x2="12"  y2="48" stroke="#f5c518" strokeWidth="1.5"/>
        {/* Ear implants */}
        <rect x="-72" y="-8" width="10" height="20" rx="2"/>
        <rect x="62"  y="-8" width="10" height="20" rx="2"/>
        {/* Data port on neck */}
        <rect x="-8" y="78" width="16" height="10" rx="1"/>
      </g>

      {/* Hex grid overlay — faint background pattern, mid area */}
      <g fill="none" stroke="#00e5ff" strokeWidth="0.6" opacity="0.025">
        {([
          [200,180],[244,180],[266,217],[244,253],[200,253],[178,217],
          [288,180],[332,180],[354,217],[332,253],[288,253],[266,217],
          [222,253],[266,253],[288,290],[266,326],[222,326],[200,290],
          [310,253],[354,253],[376,290],[354,326],[310,326],[288,290],
        ] as [number,number][]).map(([cx,cy],i) => (
          <polygon key={i} points={`${cx},${cy-36} ${cx+31},${cy-18} ${cx+31},${cy+18} ${cx},${cy+36} ${cx-31},${cy+18} ${cx-31},${cy-18}`}/>
        ))}
      </g>
    </svg>
  );
}

// ── Theme config ──────────────────────────────────────────
const THEMES = {
  'D&D': {
    bg: 'bg-[#fdf6e3]',
    text: 'text-[#2c1810]',
    selection: 'selection:bg-[#58180d] selection:text-white',
    border: 'border-[#58180d]/85',
    primary: 'text-[#58180d]',
    primaryBg: 'bg-[#58180d]',
    tabBg: 'bg-[#eadbb8]/85',
    tabActive: 'data-[state=active]:bg-[#58180d] data-[state=active]:text-white text-[#58180d]',
    tabFont: 'font-dnd-body font-bold uppercase tracking-wider text-xs',
    panelBg: 'bg-[#fff8e6]/65 border-2 border-[#58180d]/85 shadow-[0_10px_32px_rgba(88,24,13,0.10),inset_0_0_36px_rgba(88,24,13,0.045)]',
    btnOutline: 'bg-[#f7ebcf]/70 border-[#58180d]/70 text-[#58180d] hover:bg-[#58180d] hover:text-[#fdf6e3] shadow-[inset_0_0_0_1px_rgba(88,24,13,0.10)]',
    headerBorder: 'border-b-2 border-[#58180d]/80 shadow-[0_6px_18px_rgba(88,24,13,0.08)]',
  },
  'CoC': {
    bg: 'bg-[#151a18]',
    text: 'text-[#d4d4d8]',
    selection: 'selection:bg-[#2f7f68] selection:text-white',
    border: 'border-[#2f7f68]',
    primary: 'text-[#5aa58f]',
    primaryBg: 'bg-[#2f7f68]',
    tabBg: 'bg-[#0d1211]',
    tabActive: 'data-[state=active]:bg-[#2f7f68] data-[state=active]:text-[#06100d] text-[#8fb7aa]',
    tabFont: 'font-elite uppercase tracking-widest text-xs',
    panelBg: 'bg-[#0f1413]/90 border-2 border-[#2f7f68]/80 shadow-[0_10px_30px_rgba(0,0,0,0.38),inset_0_0_28px_rgba(47,127,104,0.045)]',
    btnOutline: 'bg-[#0f1413]/80 border-[#2f7f68]/70 text-[#8fb7aa] hover:bg-[#2f7f68]/25 hover:text-[#d4f3e7]',
    headerBorder: 'border-b-2 border-[#2f7f68]/80 shadow-[0_6px_18px_rgba(47,127,104,0.10)]',
  },
  'CP': {
    bg: 'bg-[#0d0d0d]',
    text: 'text-[#d4d4d8]',
    selection: 'selection:bg-[#f5c518] selection:text-[#0d0d0d]',
    border: 'border-[#8a6f25]',
    primary: 'text-[#d8b954]',
    primaryBg: 'bg-[#f5c518]',
    tabBg: 'bg-[#111]',
    tabActive: 'data-[state=active]:bg-[#f5c518] data-[state=active]:text-[#0d0d0d] text-[#d8b954]/85',
    tabFont: 'font-cp-title text-[9px] tracking-widest',
    panelBg: 'bg-[#0b0b12]/90 border border-[#8a6f25]/70 shadow-[0_10px_30px_rgba(0,0,0,0.48),inset_0_0_20px_rgba(245,197,24,0.035)]',
    btnOutline: 'bg-[#0b0b12]/70 border-[#8a6f25]/60 text-[#d8b954]/80 hover:bg-[#f5c518]/12 hover:text-[#f5c518] hover:border-[#f5c518]/80',
    headerBorder: 'border-b border-[#8a6f25]/70 shadow-[0_2px_14px_rgba(245,197,24,0.12)]',
  },
} as const;

type System = PlatformRulesetSystem;

const SYSTEM_DISPLAY_LABELS: Record<System, string> = {
  'D&D': 'DND 5e 2024',
  CoC: 'COC 7e',
  CP: 'Cyberpunk RED',
};

export function PlayWorkspace() {
  const [tab, setTab] = useState('creator');
  const { system, setSystem } = useAppStore();
  const theme = THEMES[system];

  const { character: dndChar, loadCharacter: loadDndChar } = useCharacterStore();
  const { character: cocChar, loadCharacter: loadCocChar } = useCocStore();
  const { character: cpChar, loadCharacter: loadCpChar } = useCpStore();

  const activeCharacter =
    system === 'CoC' ? cocChar
    : system === 'CP' ? cpChar
    : dndChar;

  const handleExport = () => {
    const envelope = createCharacterExportEnvelope({ system, character: activeCharacter });
    const exportSystem = platformSystemToExportSystem(system);
    const characterName = sanitizeFileName((activeCharacter as any).name || 'unnamed');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(envelope, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${exportSystem}-character-${characterName}.json`);
    dlAnchorElem.click();
    toast.success("角色已导出为平台角色 JSON。");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = parseCharacterImportJson(String(event.target?.result ?? ''));

        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        if (result.platformSystem === 'CoC') {
          loadCocChar(result.character as any);
          setSystem('CoC');
          setTab('sheet');
          toast.success("这名调查员的笔记已被寻回。", {
            description: result.message,
          });
        } else if (result.platformSystem === 'CP') {
          loadCpChar(result.character as any);
          setSystem('CP');
          setTab('sheet');
          toast.success("赛博朋克档案已加载。", {
            description: result.message,
          });
        } else {
          loadDndChar(result.character as any);
          setSystem('D&D');
          setTab('sheet');
          toast.success("冒险者的档案已被加载。", {
            description: result.message,
          });
        }
      };
      reader.readAsText(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleSwitchSystem = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSystem(e.target.value as System);
    setTab('creator');
  };

  const handleToolbarPlaceholder = (message: string) => {
    toast.info(message);
  };

  const sanitizeFileName = (name: string) => {
    const sanitized = name.trim().replace(/[^\w\u4e00-\u9fa5-]+/g, '-').replace(/-+/g, '-');
    return sanitized || 'unnamed';
  };

  const tabLabels: Record<System, string[]> = {
    'D&D': ['创建器', '角色卡', '游玩 / 战斗'],
    'CoC': ['建卡 (Creation)', '调查员卡 (Sheet)', '掷骰 & 日志 (Gameplay)'],
    'CP':  ['建卡 (Creation)', '角色卡 (Sheet)', '游玩 & 掷骰 (Gameplay)', '黑市 Market'],
  };
  const tabValues: Record<System, string[]> = {
    'D&D': ['creator', 'sheet', 'gameplay'],
    'CoC': ['creator', 'sheet', 'gameplay'],
    'CP':  ['creator', 'sheet', 'gameplay', 'market'],
  };
  const labels = tabLabels[system];
  const tabVals = tabValues[system];
  const currentPageLabel = labels[tabVals.indexOf(tab)] ?? labels[0];

  return (
    <div className={`min-h-screen font-serif p-4 md:p-8 transition-colors duration-500
      ${theme.bg} ${theme.text} ${theme.selection}`}>
      <div className="max-w-6xl mx-auto">

        {/* ── Top bar ─────────────────────────────────── */}
        <div className={`flex flex-col gap-4 mb-8 pb-4 ${theme.headerBorder}`}>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            {/* D&D title — Cinzel Decorative, parchment fantasy */}
            {system === 'D&D' && (
              <div className="flex flex-col gap-1">
                <h1 className="font-dnd-title text-3xl md:text-4xl text-[#58180d] leading-tight">
                  D&amp;D 2024
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[#58180d]/40 select-none">✦</span>
                  <span className="font-dnd-body text-sm tracking-[0.22em] text-[#58180d]/75 uppercase">
                    冒险者指南
                  </span>
                  <span className="text-[#58180d]/40 select-none">✦</span>
                </div>
              </div>
            )}

            {/* CoC title — Special Elite typewriter */}
            {system === 'CoC' && (
              <div className="flex flex-col gap-1">
                <h1 className="font-coc-title text-3xl md:text-4xl text-[#5aa58f] leading-tight">
                  克苏鲁的呼唤
                </h1>
                <span className="font-elite text-xs tracking-[0.18em] text-[#8fb7aa]/75 uppercase">
                  Call of Cthulhu &nbsp;·&nbsp; 调查员笔记
                </span>
              </div>
            )}

            {/* CP RED title — Orbitron + glitch + neon */}
            {system === 'CP' && (
              <div className="flex flex-col gap-1">
                <h1
                  className="font-cp-title text-2xl md:text-3xl neon-gold glitch leading-tight"
                  data-text="CYBERPUNK RED"
                >
                  CYBERPUNK RED
                </h1>
                <div className="flex items-center gap-1 font-cp-body text-[11px] text-[#00e5ff] neon-cyan tracking-[0.16em] uppercase">
                  <span>&gt;&gt;</span>
                  <span>角色卡</span>
                  <span className="opacity-50">·</span>
                  <span>Night City</span>
                  <span>&gt;&gt;</span>
                </div>
              </div>
            )}

            <div className={`self-start lg:self-end text-xs md:text-sm opacity-85 border ${theme.border} px-3 py-1 bg-black/5`}>
              <span className={`${theme.primary} font-bold`}>当前：</span>
              <span>{SYSTEM_DISPLAY_LABELS[system]}</span>
              <span className="opacity-50 mx-2">/</span>
              <span>{currentPageLabel}</span>
              {(activeCharacter as any).name && (
                <>
                  <span className="opacity-50 mx-2">/</span>
                  <span>{(activeCharacter as any).name}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap items-center">

              {/* System selector — 3-way dropdown */}
              <div className="relative">
                <select
                  value={system}
                  onChange={handleSwitchSystem}
                  className={`appearance-none cursor-pointer h-9 px-3 pr-8 border-2 ${theme.border} ${theme.primary} font-bold uppercase text-sm font-mono
                    bg-black/5 focus:outline-none hover:opacity-85 transition-opacity`}
                  aria-label="切换规则系统"
                >
                  <option value="D&D"  style={{ background: '#fdf6e3', color: '#2c1810' }}>DND 5e 2024</option>
                  <option value="CoC"  style={{ background: '#111',    color: '#5aa58f' }}>COC 7e</option>
                  <option value="CP"   style={{ background: '#0d0d0d', color: '#d8b954' }}>Cyberpunk RED</option>
                </select>
                <div className={`pointer-events-none absolute right-2 top-2.5 text-xs ${theme.primary}`}>▼</div>
              </div>

              {system === 'D&D' && <ModManager />}
            </div>

            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative">
                <input type="file" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" accept=".json" />
                <Button variant="outline" size="sm"
                  className={`uppercase font-bold transition-colors rounded-none ${theme.btnOutline}`}>
                  <Upload className="w-4 h-4 mr-2" /> 导入角色
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={handleExport}
                className={`uppercase font-bold transition-colors rounded-none ${theme.btnOutline}`}>
                <Save className="w-4 h-4 mr-2" /> 导出角色
              </Button>

              <Button variant="outline" size="sm" onClick={() => handleToolbarPlaceholder('数据管理功能后续实现')}
                className={`uppercase font-bold transition-colors rounded-none opacity-75 hover:opacity-100 ${theme.btnOutline}`}>
                数据
              </Button>

              <Button variant="outline" size="sm" onClick={() => handleToolbarPlaceholder('设置功能后续实现')}
                className={`uppercase font-bold transition-colors rounded-none opacity-75 hover:opacity-100 ${theme.btnOutline}`}>
                设置
              </Button>

              <Button variant="outline" size="sm" onClick={() => handleToolbarPlaceholder('帮助与规则说明后续整理')}
                className={`uppercase font-bold transition-colors rounded-none opacity-75 hover:opacity-100 ${theme.btnOutline}`}>
                帮助
              </Button>
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className={`grid w-full mb-8 p-1 border rounded-none gap-1
            ${system === 'CP' ? 'grid-cols-4 shadow-[0_0_12px_rgba(245,197,24,0.12)] border-[#8a6f25]/70' : 'grid-cols-3'}
            ${theme.tabBg} ${theme.border}
            ${system === 'CoC' ? 'border-[#2f7f68]/80' : ''}`}>
            {tabVals.map((v, i) => (
              <TabsTrigger key={v} value={v}
                className={`rounded-none transition-colors ${theme.tabActive} ${theme.tabFont}
                  ${system === 'CP' && v === 'market' ? 'data-[state=active]:bg-[#f5c518] data-[state=active]:shadow-[0_0_8px_rgba(245,197,24,0.30)]' : ''}`}>
                {labels[i]}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className={`${theme.panelBg} p-6 min-h-[70vh] relative overflow-hidden
            ${system === 'CP' ? 'cp-scanlines shadow-[inset_0_0_44px_rgba(245,197,24,0.045),0_0_0_1px_rgba(245,197,24,0.045)]' : ''}`}>
            {/* System-specific decorative background */}
            {system === 'D&D' && <DndBackground />}
            {system === 'CoC' && <CocBackground />}
            {system === 'CP'  && <CpBackground />}

            {/* Content layer above the background */}
            <div className="relative z-10">
              {system === 'D&D' && (
                <>
                  <TabsContent value="creator"><Creator onComplete={() => setTab('sheet')} /></TabsContent>
                  <TabsContent value="sheet"><Sheet /></TabsContent>
                  <TabsContent value="gameplay"><Gameplay /></TabsContent>
                </>
              )}
              {system === 'CoC' && (
                <>
                  <TabsContent value="creator"><CocCreator onComplete={() => setTab('sheet')} /></TabsContent>
                  <TabsContent value="sheet"><CocSheet /></TabsContent>
                  <TabsContent value="gameplay"><CocGameplay /></TabsContent>
                </>
              )}
              {system === 'CP' && (
                <>
                  <TabsContent value="creator"><CpCreator onComplete={() => setTab('sheet')} /></TabsContent>
                  <TabsContent value="sheet"><CpSheet /></TabsContent>
                  <TabsContent value="gameplay"><CpGameplay /></TabsContent>
                  <TabsContent value="market"><CpMarket /></TabsContent>
                </>
              )}
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
