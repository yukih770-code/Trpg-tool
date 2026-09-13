import { useEffect, useState } from 'react';
import { Creator } from './Creator';
import { Sheet } from './Sheet';
import { Gameplay } from './Gameplay';
import { useAppStore } from '../store/appStore';

import { DndWorkspaceShell, type DndWorkspaceView } from './dndWorkspace/DndWorkspaceShell';
// AI-LANDMARK: PUBLIC_SYSTEM_SCOPE_DND_ONLY_V1
// The CoC / CP RED workspace shells, builders, sheets, gameplay panels and
// market were the ONLY consumers of src/pages/coc*, src/pages/cp* — those page
// files are deleted with this pass. Their domain code (src/lib/coc-*,
// src/lib/cp-*, src/lib/cp2024, src/store/cocStore, src/store/cpStore) stays.
import { PausedGameSystemNotice } from '../components/platform/PausedGameSystemNotice';
import { readStoredLocale } from '../i18n';


import type { PlatformRulesetSystem } from '../lib/data-contract/export-envelope';

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
/** CP RED — cyberpunk: Night City skyline, circuit traces, cyborg face */
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
export type NonDndWorkspaceView = 'dashboard' | 'vault' | 'campaigns' | 'createCampaign' | 'createMethod' | 'sheet' | 'compendium' | 'sources' | 'ruleSources' | 'play' | 'planned';

export type PlayWorkspaceNavigationState = {
  tab: string;
  dndWorkspaceView: DndWorkspaceView;
  systemWorkspaceView: NonDndWorkspaceView;
  plannedSlotTitleKey: string;
};

export type PlayWorkspaceBackOverride = {
  label?: string;
  onBack: () => void;
};

type PlayWorkspaceProps = {
  navigationState?: PlayWorkspaceNavigationState;
  onNavigationChange?: (state: PlayWorkspaceNavigationState) => void;
  onBeforeNavigate?: () => void;
  onBack?: () => void;
  canGoBack?: boolean;
  onBackOverrideChange?: (override: PlayWorkspaceBackOverride | null) => void;
  onOpenPersonalContentWorkshop?: () => void;
};

export const defaultPlayWorkspaceNavigationState: PlayWorkspaceNavigationState = {
  tab: 'creator',
  dndWorkspaceView: 'dashboard',
  systemWorkspaceView: 'dashboard',
  plannedSlotTitleKey: 'multiWorkspace.planned.title',
};

export function PlayWorkspace({
  navigationState,
  onNavigationChange,
  onBeforeNavigate,
  onBack,
  canGoBack = false,
  onBackOverrideChange,
  onOpenPersonalContentWorkshop,
}: PlayWorkspaceProps) {
  const [tab, setTab] = useState(navigationState?.tab ?? defaultPlayWorkspaceNavigationState.tab);
  // AI-LANDMARK: DND_PRODUCT_SHELL_PHASE_1
  // DND enters through the workspace dashboard first; 'play' renders the
  // preserved tab workspace below unchanged.
  const [dndWorkspaceView, setDndWorkspaceView] = useState<DndWorkspaceView>(
    navigationState?.dndWorkspaceView ?? defaultPlayWorkspaceNavigationState.dndWorkspaceView,
  );
  // AI-LANDMARK: MULTI_SYSTEM_WORKSPACE_PLANNED_SLOTS
  // COC / CP RED now enter lightweight module dashboards; planned slots stay placeholder-only.
  const [systemWorkspaceView, setSystemWorkspaceView] = useState<NonDndWorkspaceView>(
    navigationState?.systemWorkspaceView ?? defaultPlayWorkspaceNavigationState.systemWorkspaceView,
  );
  const [plannedSlotTitleKey, setPlannedSlotTitleKey] = useState<string>(
    navigationState?.plannedSlotTitleKey ?? defaultPlayWorkspaceNavigationState.plannedSlotTitleKey,
  );
  const [dndSheetInitialSection, setDndSheetInitialSection] = useState<string | undefined>();
  const { system } = useAppStore();

  useEffect(() => {
    if (!navigationState) return;
    setTab(navigationState.tab);
    setDndWorkspaceView(navigationState.dndWorkspaceView);
    setSystemWorkspaceView(navigationState.systemWorkspaceView);
    setPlannedSlotTitleKey(navigationState.plannedSlotTitleKey);
  }, [navigationState]);

  const emitNavigationState = (next: Partial<PlayWorkspaceNavigationState>) => {
    onNavigationChange?.({
      tab,
      dndWorkspaceView,
      systemWorkspaceView,
      plannedSlotTitleKey,
      ...next,
    });
  };

  const navigatePlayWorkspace = (next: Partial<PlayWorkspaceNavigationState>, apply: () => void) => {
    onBeforeNavigate?.();
    apply();
    emitNavigationState(next);
  };

  const navigateBackOrVault = () => {
    if (canGoBack && onBack) {
      onBack();
      return;
    }

    setSystemWorkspaceView('vault');
    emitNavigationState({ systemWorkspaceView: 'vault' });
  };

  const openDndPlayTab = (nextTab: 'creator' | 'sheet' | 'gameplay', sheetInitialSection?: string) => {
    navigatePlayWorkspace({ tab: nextTab, dndWorkspaceView: 'play' }, () => {
      setTab(nextTab);
      setDndWorkspaceView('play');
      setDndSheetInitialSection(nextTab === 'sheet' ? sheetInitialSection : undefined);
    });
  };
  // AI-LANDMARK: COC_CPRED_DND_ALIGNED_WORKSPACE_RECONSTRUCTION
  // cocModuleCards / cpModuleCards / getNonDndWorkspaceTone / renderNonDndWorkspaceDashboard /
  // renderCharacterVault / renderCreationMethod / renderPlannedSlot removed.
  // COC / CP RED workspace IA is fully delegated to CocWorkspaceShell / CpWorkspaceShell.

  const dndPlayBody = (
    <div className={`min-h-screen p-3 font-serif transition-colors duration-500 md:p-6 ${THEMES['D&D'].bg} ${THEMES['D&D'].text} ${THEMES['D&D'].selection}`}>
      <div className="mx-auto w-full max-w-[1500px]">
        <div className={`${THEMES['D&D'].panelBg} relative min-h-[70vh] overflow-hidden rounded-lg p-3 md:p-5`}>
          <DndBackground />
          <div className="relative z-10">
            {tab === 'creator' && (
              <Creator
                onComplete={() => openDndPlayTab('sheet', 'equipment')}
                onOpenPersonalContentWorkshop={onOpenPersonalContentWorkshop}
              />
            )}
            {/* AI-LANDMARK: ACTOR_VAULT_RESPONSIBILITY_CLEANUP_HIDE_RUNTIME_CTA_V1 — onStartPlaying not passed; runtime entry gated. */}
            {tab === 'sheet' && <Sheet initialSection={dndSheetInitialSection} />}
            {tab === 'gameplay' && <p className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">本地角色游玩：使用角色库数据；联机战斗请进入房间桌面。</p>}
            {tab === 'gameplay' && <Gameplay />}
          </div>
        </div>
      </div>
    </div>
  );

  if (system === 'D&D') {
    return (
      <DndWorkspaceShell
        view={dndWorkspaceView}
        onViewChange={(nextView) =>
          navigatePlayWorkspace({ dndWorkspaceView: nextView }, () => {
            setDndWorkspaceView(nextView);
          })
        }
        onOpenPlayTab={openDndPlayTab}
        onGlobalBackOverrideChange={onBackOverrideChange}
      >
        {dndPlayBody}
      </DndWorkspaceShell>
    );
  }

  // AI-LANDMARK: PUBLIC_SYSTEM_SCOPE_DND_ONLY_V1
  // Call of Cthulhu and Cyberpunk Red are paused in the public frontend. The
  // old embedded legacy body (CocBackground / CpBackground / builder / sheet /
  // gameplay / market branches) is removed rather than left beside the new IA.
  // Reaching here now means a stored non-D&D selection, so say so plainly
  // instead of opening a retired editor.
  return (
    <PausedGameSystemNotice
      locale={readStoredLocale()}
      systemId={system === 'CoC' ? 'coc7e' : 'cp-red'}
      onBack={canGoBack ? navigateBackOrVault : undefined}
    />
  );
}
