import { useMemo, useRef, useState, type ReactNode } from 'react';
import type { DndAttackIntent, DndAttackResponse } from '../../lib/dnd/dndAttackIntent';
import { DndAttackPendingIntent } from '../../lib/dnd/dndAttackPendingIntent';
import { RoomServerHttpError } from '../../lib/platform/roomServerHttpClient';
import { RoomAttackResult } from './RoomAttackResolutionDetails';

import type { RoomRuntimeDndActionShortcut } from '../../lib/platform/roomRuntimeActorProjectionTypes';
import type { SharedDiceRollMode, SharedDiceRollResult } from '../../lib/platform/sharedDiceTypes';

export interface RuntimeDndActionPanelProps {
  scopeKey: string;
  actorVitals?: ReactNode;
  onRefreshActions?: () => void;
  actorCombatantId?: string;
  actors?: Array<{ id: string; label: string }>;
  onSelectActor?: (actorId: string) => void;
  onDeclare?: (intent: DndAttackIntent) => Promise<DndAttackResponse>;
  actionsError?: string;
  actionsLoading?: boolean;
  actionGuidance?: ReactNode;
  characterName?: string;
  actions: RoomRuntimeDndActionShortcut[];
  targets?: Array<{ id: string; label: string }>;
  selectedTargetId?: string;
  onSelectTarget?: (targetId: string | undefined) => void;
  /**
   * Submits the roll to the authoritative room dice path. When it resolves, the
   * panel shows THAT result; it never recomputes a roll of its own.
   */
  onRoll?: (input: { expression: string; label: string; mode?: SharedDiceRollMode; dc?: number }) => Promise<SharedDiceRollResult> | void;
}

const ROLL_MODE_OPTIONS: Array<{ id: SharedDiceRollMode; label: string }> = [
  { id: 'normal', label: '普通' },
  { id: 'advantage', label: '优势' },
  { id: 'disadvantage', label: '劣势' },
];

export function dndAttackErrorText(error: unknown): string {
  if (error instanceof RoomServerHttpError) {
    const messages: Record<string, string> = {
      dnd_attack_out_of_range: '目标超出此攻击的近战范围。',
      unknown_action: '该攻击已变更或不可用，请刷新动作后重新选择。',
      invalid_actor_combatant: '行动角色已不可用，请重新选择。',
      invalid_target_combatant: '目标已不可用，请重新选择。',
      actor_not_controlled: '你不能控制该角色，请选择自己的已准入角色。',
      stale_resolution: '战场状态已变化，请确认角色与目标后重新攻击。',
    };
    if (messages[error.message]) return messages[error.message];
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Player-facing DND action palette for the Room Runtime.
 *
 * T12 attacks declare intent only. HP arrives through authoritative replay.
 * The independent generic dice launcher remains a manual check tool.
 *
 * T1: d20 rolls may carry 普通 / 优势 / 劣势 as semantic intent, and the latest
 * AUTHORITATIVE server result is shown inline so a player no longer has to open
 * the log drawer to see their own roll. The RuntimeLog remains the shared,
 * durable history; this strip is only the initiating player's echo.
 */
export function RuntimeDndActionPanel({
  scopeKey, actorCombatantId, actors, onSelectActor, onDeclare, actionsError, actionsLoading, actionGuidance, actorVitals, onRefreshActions,
  characterName,
  actions,
  targets = [],
  selectedTargetId,
  onSelectTarget,
  onRoll,
}: RuntimeDndActionPanelProps) {
  const [rollMode, setRollMode] = useState<SharedDiceRollMode>('normal');
  const [lastRoll, setLastRoll] = useState<SharedDiceRollResult | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);
  const pendingStore = useMemo(() => {
    let storage: Storage | undefined;
    try { storage = window.sessionStorage; } catch { /* Browser storage can be disabled. */ }
    return new DndAttackPendingIntent(`t12:${scopeKey}`, storage);
  }, [scopeKey]);
  const [pendingAttack, setPendingAttack] = useState(() => pendingStore.read());
  const [attackResult, setAttackResult] = useState<DndAttackResponse | null>(null);
  const [attackError, setAttackError] = useState<{ intent: DndAttackIntent; message: string; rejected: boolean }>();
  const [attackBusy, setAttackBusy] = useState(false);
  const attackBusyRef = useRef(false);
  const submitAttack = async (intent: DndAttackIntent) => {
    if (!onDeclare || attackBusyRef.current) return;
    attackBusyRef.current = true; setAttackBusy(true); setAttackError(undefined);
    try {
      const result = await onDeclare(intent);
      setAttackResult(result); pendingStore.complete(intent.intentId); setPendingAttack(undefined);
    } catch (error) {
      const rejected = error instanceof RoomServerHttpError && error.status >= 400 && error.status < 500;
      setAttackError({ intent, message: dndAttackErrorText(error), rejected });
      // Only a definite rejected request may be abandoned automatically. Lost
      // responses / 5xx keep the same frozen intent for the explicit retry.
      if (rejected) {
        pendingStore.complete(intent.intentId); setPendingAttack(undefined);
      }
    } finally { attackBusyRef.current = false; setAttackBusy(false); }
  };
  const declareAttack = (actionId: string) => {
    if (!actorCombatantId || !selectedTargetId || pendingStore.read() || attackBusyRef.current) return;
    const intent = pendingStore.begin({ actorCombatantId, targetCombatantId: selectedTargetId, actionId, mode: rollMode });
    setPendingAttack(intent); void submitAttack(intent);
  };

  const [selectedActionId, setSelectedActionId] = useState('');
  const attacks = actions.filter((action) => action.kind === 'weapon_attack' || action.kind === 'spell_attack');
  const actionId = pendingAttack?.actionId ?? attacks.find((action) => action.id === selectedActionId)?.id ?? attacks[0]?.id ?? '';
  const displayedTargetId = pendingAttack?.targetCombatantId ?? selectedTargetId;
  const displayedActorId = pendingAttack?.actorCombatantId ?? actorCombatantId;
  const validTarget = targets.some((target) => target.id === selectedTargetId);
  const frozen = attackBusy || !!pendingAttack;
  const labelPrefix = characterName?.trim() || '我的角色';
  // Resolve labels only from current projected choices. A pending intent can
  // outlive a parent selection change; never borrow the newly selected actor's
  // name or action list for that frozen intent.
  const actorLabel = (id?: string) => actors?.find(actor => actor.id === id)?.label
    ?? targets.find(target => target.id === id)?.label
    ?? (id && id === actorCombatantId ? characterName?.trim() : undefined)
    ?? '待确认角色';
  const actionLabel = (id: string, actorId?: string) => actorId === actorCombatantId
    ? attacks.find(action => action.id === id)?.name ?? '待确认动作' : '待确认动作';
  const targetLabel = (id?: string) => targets.find(target => target.id === id)?.label ?? '未选择或不可见的目标';
  const intentSummary = (intent: Pick<DndAttackIntent, 'actorCombatantId' | 'actionId' | 'targetCombatantId'>) =>
    `${actorLabel(intent.actorCombatantId)} → ${actionLabel(intent.actionId, intent.actorCombatantId)} → ${targetLabel(intent.targetCombatantId)}`;
  const summary = intentSummary({ actorCombatantId: displayedActorId ?? '', actionId, targetCombatantId: displayedTargetId ?? '' });
  const submitRoll = async (input = { expression: '1d20', label: labelPrefix + ' 检定', mode: rollMode }) => {
    try {
      const result = await onRoll?.(input);
      if (result) setLastRoll(result);
      setRollError(null);
    } catch (error) { setRollError(error instanceof Error ? error.message : String(error)); }
  };
  if (!actorCombatantId && !pendingAttack) return <section className="live-exploration-actions" aria-label="角色与动作"><div><strong>{characterName || (actors ? '主持人' : '我的角色')}</strong><span>{actorVitals || '探索中 · 将角色加入战斗后可使用攻击。'}</span></div>{onRoll && <button type="button" onClick={() => void submitRoll()}>掷 d20</button>}{rollError && <span role="alert">{rollError}</span>}{lastRoll && <span role="status">检定 {lastRoll.total}</span>}</section>;
  return <section aria-label="攻击动作" data-live-attack>
    <p className="live-attack-summary" aria-live="polite" aria-atomic="true" data-attack-summary>
      <strong>{pendingAttack ? '待确认攻击' : '准备攻击'}</strong> · {summary}
      {displayedActorId && displayedActorId === displayedTargetId && <span> · 目标是行动角色自身，请确认选择。</span>}
    </p>
    <div className="live-action-form">
      {actors ? <label className="live-actor-select">控制角色 / NPC
        <select aria-label="控制角色 / NPC" disabled={frozen} value={displayedActorId ?? ''} onChange={(event) => onSelectActor?.(event.target.value)}>
          <option value="">选择行动角色</option>{pendingAttack && !actors.some((actor) => actor.id === displayedActorId) && <option value={displayedActorId}>待确认角色</option>}{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.label}</option>)}
        </select>
      </label> : <div className="live-actor-quick"><strong>{actorLabel(displayedActorId)}</strong><small>{displayedActorId === actorCombatantId ? actorVitals ?? '选择动作与目标' : '待确认攻击使用原行动角色'}</small></div>}
      <label>动作<select aria-label="攻击动作" disabled={frozen || !attacks.length} value={actionId} onChange={(event) => setSelectedActionId(event.target.value)}>
        {pendingAttack && displayedActorId !== actorCombatantId ? <option value={actionId}>待确认动作</option> : <>{pendingAttack && !attacks.some((action) => action.id === actionId) ? <option value={actionId}>待确认动作</option> : !attacks.length && <option value="">暂无攻击动作</option>}{attacks.map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}</>}
      </select></label>
      <label className="live-target-field">目标<select aria-label="攻击目标" disabled={frozen} value={pendingAttack ? displayedTargetId : validTarget ? selectedTargetId : ''} onChange={(event) => onSelectTarget?.(event.target.value || undefined)}>
        <option value="">在地图上选择目标</option>{pendingAttack && !targets.some((target) => target.id === displayedTargetId) && <option value={displayedTargetId}>待确认目标</option>}{targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
      </select></label>
      <label>掷骰方式<select aria-label="掷骰方式" disabled={frozen} value={pendingAttack?.mode ?? rollMode} onChange={(event) => setRollMode(event.target.value as SharedDiceRollMode)}>
        {ROLL_MODE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select></label>
      <button className="live-attack-button" type="button" disabled={!onDeclare || !actorCombatantId || !validTarget || !actionId || frozen || actionsLoading || !!actionsError} onClick={() => declareAttack(actionId)}>{attackBusy ? '结算中…' : '攻击'}</button>
    </div>
    <div className="live-action-feedback">
      {actionsError && <p role="alert" className="text-red-700">动作读取失败：{actionsError} {onRefreshActions && <button type="button" className="underline" onClick={onRefreshActions}>重新读取</button>}</p>}
      {actionsLoading && <p role="status">正在读取可用攻击…</p>}
      {!attacks.length && !actionsError && !actionsLoading && <div className="text-slate-600" data-empty-attack-guidance><p>暂无可用攻击。{actionGuidance ? '' : '请检查已批准角色的装备与来源，或在战役战斗卡中添加攻击。'}</p>{actionGuidance} {onRefreshActions && <button type="button" className="underline" onClick={onRefreshActions}>刷新动作</button>} {onRoll && <button type="button" className="ml-2 underline" onClick={() => void submitRoll()}>掷 d20</button>}</div>}
      {attacks.length > 0 && !validTarget && !pendingAttack && <p className="text-slate-600">选择目标后即可攻击。</p>}
      {pendingAttack && <div role="status" className="flex items-center justify-between gap-2 text-amber-800"><span>{attackBusy ? '正在结算攻击…' : '攻击尚未确认；重试会恢复同一次结果。'}</span><button type="button" disabled={attackBusy || !onDeclare} onClick={() => void submitAttack(pendingAttack)} className="rounded border border-amber-400 px-3 py-1">重试同一攻击</button></div>}
      {attackError && <div role="alert" className="text-red-700" data-attack-error><strong>{attackError.rejected ? '本次攻击请求被拒绝' : '本次攻击结果尚未确认'}</strong><p>{intentSummary(attackError.intent)}</p><p>{attackError.message}</p>{attackError.rejected && onRefreshActions && <button type="button" className="underline" onClick={onRefreshActions}>重新读取可用攻击</button>}</div>}
      {rollError && <p role="alert" className="text-red-700">检定：{rollError}</p>}
      {attackResult && <details data-previous-attack-result key={attackResult.event.eventId} open={!pendingAttack && !attackError}>
        <summary>最近已确认的攻击 · 历史结果</summary>
        <RoomAttackResult event={attackResult.event} />{attackResult.replayed && <small>已恢复原始结果。</small>}
      </details>}
      {lastRoll && <p role="status">检定 {lastRoll.total} · {lastRoll.normalizedExpression}</p>}
      {actions.some((action) => action.kind !== 'weapon_attack' && action.kind !== 'spell_attack') && <details><summary className="cursor-pointer">其他动作与法术</summary><div className="flex flex-wrap gap-3 py-2">{actions.filter((action) => action.kind !== 'weapon_attack' && action.kind !== 'spell_attack').map((action) => <span key={action.id}>{action.name}{action.saveDc !== undefined && <small> · DC {action.saveDc} {action.saveAbility}</small>}{action.range && <small> · {action.range}</small>}{action.kind === 'damage_only' && action.damageFormula && <button type="button" className="ml-2 underline" disabled={!onRoll} onClick={() => void submitRoll({ expression: action.damageFormula!, label: labelPrefix + ' · ' + action.name, mode: 'normal' })}>手动掷骰</button>}{action.kind === 'spell_cast' && <small> · 主持人裁定</small>}</span>)}</div></details>}
    </div>
  </section>;
}
