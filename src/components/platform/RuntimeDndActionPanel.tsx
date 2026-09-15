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
  if (error instanceof RoomServerHttpError && error.message === 'dnd_attack_out_of_range') {
    return '目标超出此攻击的近战范围。';
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
  scopeKey, actorCombatantId, actors, onSelectActor, onDeclare, actionsError, actorVitals, onRefreshActions,
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
  const [attackBusy, setAttackBusy] = useState(false);
  const attackBusyRef = useRef(false);
  const submitAttack = async (intent: DndAttackIntent) => {
    if (!onDeclare || attackBusyRef.current) return;
    attackBusyRef.current = true; setAttackBusy(true); setRollError(null);
    try {
      const result = await onDeclare(intent);
      setAttackResult(result); pendingStore.complete(intent.intentId); setPendingAttack(undefined);
    } catch (error) {
      setRollError(dndAttackErrorText(error));
      // Only a definite rejected request may be abandoned automatically. Lost
      // responses / 5xx keep the same frozen intent for the explicit retry.
      if (error instanceof RoomServerHttpError && error.status >= 400 && error.status < 500) {
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
  const submitRoll = async (input = { expression: '1d20', label: labelPrefix + ' 检定', mode: rollMode }) => {
    try {
      const result = await onRoll?.(input);
      if (result) setLastRoll(result);
      setRollError(null);
    } catch (error) { setRollError(error instanceof Error ? error.message : String(error)); }
  };
  if (!actorCombatantId && !pendingAttack) return <section className="live-exploration-actions" aria-label="角色与动作"><div><strong>{characterName || (actors ? '主持人' : '我的角色')}</strong><span>{actorVitals || '探索中 · 将角色加入战斗后可使用攻击。'}</span></div>{onRoll && <button type="button" onClick={() => void submitRoll()}>掷 d20</button>}{rollError && <span role="alert">{rollError}</span>}{lastRoll && <span role="status">检定 {lastRoll.total}</span>}</section>;
  return <section aria-label="攻击动作" data-live-attack>
    <div className="live-action-form">
      {actors ? <label className="live-actor-select">控制角色 / NPC
        <select aria-label="控制角色 / NPC" disabled={frozen} value={displayedActorId ?? ''} onChange={(event) => onSelectActor?.(event.target.value)}>
          <option value="">选择行动角色</option>{pendingAttack && !actors.some((actor) => actor.id === displayedActorId) && <option value={displayedActorId}>待确认角色</option>}{actors.map((actor) => <option key={actor.id} value={actor.id}>{actor.label}</option>)}
        </select>
      </label> : <div className="live-actor-quick"><strong>{labelPrefix}</strong><small>{actorVitals ?? (actorCombatantId ? '选择动作与目标' : '尚未加入战斗')}</small></div>}
      <label>动作<select aria-label="攻击动作" disabled={frozen || !attacks.length} value={actionId} onChange={(event) => setSelectedActionId(event.target.value)}>
        {pendingAttack && !attacks.some((action) => action.id === actionId) ? <option value={actionId}>待确认动作</option> : !attacks.length && <option value="">暂无攻击动作</option>}{attacks.map((action) => <option key={action.id} value={action.id}>{action.name}</option>)}
      </select></label>
      <label className="live-target-field">目标<select aria-label="攻击目标" disabled={frozen} value={pendingAttack ? displayedTargetId : validTarget ? selectedTargetId : ''} onChange={(event) => onSelectTarget?.(event.target.value || undefined)}>
        <option value="">在地图上选择目标</option>{pendingAttack && !targets.some((target) => target.id === displayedTargetId) && <option value={displayedTargetId}>待确认目标</option>}{targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
      </select></label>
      <label>掷骰方式<select aria-label="掷骰方式" disabled={frozen} value={pendingAttack?.mode ?? rollMode} onChange={(event) => setRollMode(event.target.value as SharedDiceRollMode)}>
        {ROLL_MODE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select></label>
      <button className="live-attack-button" type="button" disabled={!onDeclare || !actorCombatantId || !validTarget || !actionId || frozen} onClick={() => declareAttack(actionId)}>{attackBusy ? '结算中…' : '攻击'}</button>
    </div>
    <div className="live-action-feedback">
      {actionsError && <p role="alert" className="text-red-700">动作读取失败：{actionsError} {onRefreshActions && <button type="button" className="underline" onClick={onRefreshActions}>重新读取</button>}</p>}
      {!attacks.length && !actionsError && <p className="text-slate-600">{actorCombatantId ? '暂无已编写的攻击；请在战役角色资料中添加。' : '将角色加入战斗后可使用攻击。'} {onRefreshActions && <button type="button" className="underline" onClick={onRefreshActions}>刷新动作</button>} {onRoll && <button type="button" className="ml-2 underline" onClick={() => void submitRoll()}>掷 d20</button>}</p>}
      {attacks.length > 0 && !validTarget && !pendingAttack && <p className="text-slate-600">选择目标后即可攻击。</p>}
      {pendingAttack && <div role="status" className="flex items-center justify-between gap-2 text-amber-800"><span>{attackBusy ? '正在结算攻击…' : '攻击尚未确认；重试会恢复同一次结果。'}</span><button type="button" disabled={attackBusy || !onDeclare} onClick={() => void submitAttack(pendingAttack)} className="rounded border border-amber-400 px-3 py-1">重试同一攻击</button></div>}
      {rollError && <p role="alert" className="text-red-700">{rollError}</p>}
      {attackResult && <div role="status"><RoomAttackResult event={attackResult.event} />{attackResult.replayed && <small>已恢复原始结果。</small>}</div>}
      {lastRoll && <p role="status">检定 {lastRoll.total} · {lastRoll.normalizedExpression}</p>}
      {actions.some((action) => action.kind !== 'weapon_attack' && action.kind !== 'spell_attack') && <details><summary className="cursor-pointer">其他动作与法术</summary><div className="flex flex-wrap gap-3 py-2">{actions.filter((action) => action.kind !== 'weapon_attack' && action.kind !== 'spell_attack').map((action) => <span key={action.id}>{action.name}{action.saveDc !== undefined && <small> · DC {action.saveDc} {action.saveAbility}</small>}{action.range && <small> · {action.range}</small>}{action.kind === 'damage_only' && action.damageFormula && <button type="button" className="ml-2 underline" disabled={!onRoll} onClick={() => void submitRoll({ expression: action.damageFormula!, label: labelPrefix + ' · ' + action.name, mode: 'normal' })}>手动掷骰</button>}{action.kind === 'spell_cast' && <small> · 主持人裁定</small>}</span>)}</div></details>}
    </div>
  </section>;
}
