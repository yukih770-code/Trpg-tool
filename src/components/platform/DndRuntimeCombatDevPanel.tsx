import { useState } from 'react';

import { useRuntimeCombatStore } from '../../lib/dnd2024/gameplay/runtimeCombatStore';
import { makeDaggerAttackFlowSmokeEncounter } from '../../lib/dnd2024/gameplay/daggerAttackFlowSmoke';

/**
 * DND Runtime Combat Dev Panel (v0).
 *
 * AI-LANDMARK: DND_RUNTIME_COMBAT_DEV_PANEL_V0
 *
 * Isolated SMOKE/DEBUG UI to manually drive the dagger attack loop through the
 * runtime combat store: start a fixed smoke encounter → run a dagger attack →
 * flush pending log drafts to the local RuntimeLog (under a dedicated smoke
 * campaign id only). This is NOT production combat UI: no real character/equipment/
 * spell data, no map/initiative/turns, no Action Dock. It never writes Character
 * Library state and never clears real logs.
 */

const SMOKE_CAMPAIGN_ID = 'campaign.smoke.dnd-runtime';
const SMOKE_SESSION_ID = 'session.smoke.dnd-runtime';

export function DndRuntimeCombatDevPanel() {
  // Reactive reads for the live readout.
  const encounter = useRuntimeCombatStore((s) => s.encounter);
  const pendingLogDrafts = useRuntimeCombatStore((s) => s.pendingLogDrafts);
  const warnings = useRuntimeCombatStore((s) => s.warnings);
  const selection = useRuntimeCombatStore((s) => s.selection);

  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetHp = encounter?.actors['actor.target']?.hp.current;

  const startSmokeEncounter = () => {
    const store = useRuntimeCombatStore.getState();
    store.resetEncounter();
    store.startEncounter({ encounter: makeDaggerAttackFlowSmokeEncounter() });
    store.selectActor('actor.attacker');
    store.selectTarget('actor.target');
    setSummary('Started smoke encounter.');
    setError(null);
  };

  const runDaggerAttack = () => {
    try {
      const result = useRuntimeCombatStore.getState().runDaggerAttack({
        actorId: 'actor.attacker',
        targetId: 'actor.target',
        d20: 13,
        damageRollTotal: 2,
        abilityModifier: 3,
        proficiencyBonus: 2,
        actorName: '测试游荡者',
        targetName: '测试靶子',
        timestamp: 0,
      });
      const roll = result.flowResult.resolverResult;
      const hpAfter = useRuntimeCombatStore.getState().encounter?.actors['actor.target']?.hp.current;
      setSummary(
        `Attack: hit=${roll.hit} · attackTotal=${roll.attackRoll.total} · damage=${roll.damageRoll?.total ?? 0} · targetHpAfter=${hpAfter} · pendingDrafts=${result.pendingLogDrafts.length}`,
      );
      setError(null);
    } catch (err) {
      setError(`Run dagger attack failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const flushPendingLogs = () => {
    const result = useRuntimeCombatStore.getState().flushPendingLogDrafts({
      campaignId: SMOKE_CAMPAIGN_ID,
      sessionId: SMOKE_SESSION_ID,
      actorId: 'actor.attacker',
      targetId: 'actor.target',
    });
    const pendingAfter = useRuntimeCombatStore.getState().pendingLogDrafts.length;
    setSummary(
      `Flush: appended=${result.appendedCount} · skipped=${result.skippedCount} · warnings=${result.warnings.length} · pendingAfter=${pendingAfter}`,
    );
    setError(null);
  };

  const btn =
    'rounded border border-current/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide opacity-90 hover:opacity-100';

  return (
    <div className="mt-3 rounded-lg border border-amber-600/40 bg-amber-50/60 p-3 text-[11px] text-amber-950">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-amber-600/30 pb-1.5">
        <span className="text-xs font-black uppercase tracking-wide">DND Runtime Dev Panel</span>
        <span className="rounded-full bg-amber-600/15 px-2 py-0.5 text-[9px] font-bold">Smoke-only · Not production combat UI</span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        <button type="button" onClick={startSmokeEncounter} className={btn}>Start Smoke Encounter</button>
        <button type="button" onClick={runDaggerAttack} className={btn} disabled={!encounter}>Run Dagger Attack</button>
        <button type="button" onClick={flushPendingLogs} className={btn} disabled={pendingLogDrafts.length === 0}>Flush Pending Logs</button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div>Target HP: <strong>{targetHp ?? '—'}</strong></div>
        <div>Pending drafts: <strong>{pendingLogDrafts.length}</strong></div>
        <div>Warnings: <strong>{warnings.length}</strong></div>
        <div>Encounter: <strong>{encounter ? encounter.encounterId : 'none'}</strong></div>
        <div>Selected actor: <strong>{selection.selectedActorId ?? '—'}</strong></div>
        <div>Selected target: <strong>{selection.selectedTargetId ?? '—'}</strong></div>
      </div>

      {summary && <div className="mt-2 rounded border border-amber-600/30 bg-white/60 px-2 py-1 font-mono text-[10px]">{summary}</div>}
      {error && <div className="mt-2 rounded border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-700">{error}</div>}
      {warnings.length > 0 && (
        <div className="mt-1 text-[10px] text-amber-800">最近警告: {warnings[warnings.length - 1].message}</div>
      )}
    </div>
  );
}
