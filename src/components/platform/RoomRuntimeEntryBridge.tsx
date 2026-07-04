import { useCallback, useEffect, useState } from 'react';

import type { RoomRuntimeEntryContext, RoomRuntimeEntryMode } from '../../lib/platform/roomRuntimeEntryTypes';
import type { RoomCampaignRefSource, RoomReadyStatus, RoomSnapshot } from '../../lib/platform/roomTypes';
import type { RoomRuntimeLogEvent } from '../../lib/platform/roomRuntimeLogTypes';
import {
  appendRoomRuntimeLogEvent,
  listRoomRuntimeLog,
  rollSharedDice,
  type RoomServerHttpClientConfig,
} from '../../lib/platform/roomServerHttpClient';
import { RuntimeFullscreenShell, type RuntimeShellMode } from './RuntimeFullscreenShell';
import { SharedDiceDock } from './SharedDiceDock';
import { RuntimeActionDock, buildRuntimeDockActions } from './RuntimeActionDock';
import { RoomRuntimeLogPreviewPanel } from './RoomRuntimeLogPreviewPanel';
import { RuntimePublicInfoPanel, type RuntimePublicInfoItem } from './RuntimePublicInfoPanel';
import { RuntimeManualStateLogPanel, type RuntimeStateLogItem } from './RuntimeManualStateLogPanel';

/**
 * RoomRuntimeEntryBridge (v0 / UI1a) — read-only Runtime Entry Preview.
 *
 * AI-LANDMARK: ROOM_RUNTIME_ENTRY_BRIDGE_V0
 *
 * The surface a member lands on after clicking "进入跑团桌面预览" in the lobby.
 * Now rendered inside the fullscreen RuntimeFullscreenShell (UI1a) with Host /
 * Player / Spectator slot differentiation. It is still a READ-ONLY preview of the
 * room runtime entry context — NOT the runtime. No map / token / RuntimeLog /
 * action intent, no RuntimeActor / CampaignActorInstance, no store writes. The
 * entry guard result (admissionId / approvedActorBindingId / "已准入角色") is
 * preserved. System-agnostic. No server / WebSocket / RuntimeLog API change.
 */

export interface RoomRuntimeEntryBridgeProps {
  context: RoomRuntimeEntryContext;
  room?: RoomSnapshot;
  serverLabel?: string;
  onBackToLobby?: () => void;
}

const ENTRY_MODE_LABEL: Record<RoomRuntimeEntryMode, string> = {
  hostPreview: '主持人预览',
  playerReady: '玩家（已准备）',
  spectatorPreview: '旁观预览',
};

const READY_LABEL: Record<RoomReadyStatus, string> = {
  ready: '已准备',
  notReady: '未准备',
};

const CAMPAIGN_SOURCE_LABEL: Record<RoomCampaignRefSource, string> = {
  localCampaignLibrary: '本地战役库',
  imported: '导入战役',
  workshop: '工坊',
  unknown: '未知来源',
};

function entryModeToShellMode(mode: RoomRuntimeEntryMode): RuntimeShellMode {
  if (mode === 'hostPreview') return 'host';
  if (mode === 'spectatorPreview') return 'spectator';
  return 'player';
}

function shortId(id: string): string {
  return id.length <= 8 ? id : `…${id.slice(-6)}`;
}

export function RoomRuntimeEntryBridge({ context, room, serverLabel, onBackToLobby }: RoomRuntimeEntryBridgeProps) {
  // Bridge has no WebSocket of its own; a member's own dice roll returns the event
  // and is fed to the log panel as a live event (other windows get it via WS).
  const [logLiveEvents, setLogLiveEvents] = useState<RoomRuntimeLogEvent[]>([]);

  // Room mode: the SERVER rolls (crypto) and writes the room RuntimeLog; we feed
  // the returned event into the log panel and return the roll to the dock.
  const diceConfig: RoomServerHttpClientConfig = { baseUrl: context.serverBaseUrl };
  const handleRoomDiceRoll = async (input: { expression: string; label?: string }) => {
    if (!context.currentMemberId) throw new Error('需要成员身份才能掷骰。');
    const resp = await rollSharedDice(diceConfig, context.roomId, {
      memberId: context.currentMemberId,
      expression: input.expression,
      label: input.label,
    });
    if (resp.ok === false) throw new Error(resp.message || resp.error);
    setLogLiveEvents((prev) => [...prev, resp.event]);
    return resp.roll;
  };

  // ── Public info / manual state records (M29) ──────────────────────────────
  // Server-authoritative: published/recorded through the room RuntimeLog append
  // endpoint (host.note / state.manualChange, public). The bridge keeps a small
  // filtered mirror for the dock panels; the full log stays in the log drawer.
  const isNoteKind = (e: RoomRuntimeLogEvent) => e.kind === 'host.note' || e.kind === 'state.manualChange';
  const [noteEvents, setNoteEvents] = useState<RoomRuntimeLogEvent[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const loadNotes = useCallback(() => {
    setNotesLoading(true);
    setNotesError(null);
    listRoomRuntimeLog({ baseUrl: context.serverBaseUrl }, context.roomId)
      .then((result) => setNoteEvents(result.events.filter(isNoteKind)))
      .catch((e) => setNotesError(e instanceof Error ? e.message : String(e)))
      .finally(() => setNotesLoading(false));
  }, [context.serverBaseUrl, context.roomId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const mergeNoteEvent = (event: RoomRuntimeLogEvent) => {
    if (!isNoteKind(event)) return;
    setNoteEvents((prev) =>
      prev.some((e) => e.eventId === event.eventId) ? prev : [...prev, event].sort((a, b) => a.seq - b.seq),
    );
  };

  const appendNote = async (input: {
    kind: 'host.note' | 'state.manualChange';
    text: string;
    payload: unknown;
  }) => {
    if (!context.currentMemberId) throw new Error('需要成员身份才能发布。');
    const { event } = await appendRoomRuntimeLogEvent({ baseUrl: context.serverBaseUrl }, context.roomId, {
      kind: input.kind,
      visibility: 'public',
      text: input.text,
      payload: input.payload,
      authorMemberId: context.currentMemberId,
    });
    mergeNoteEvent(event);
    // Feed the shared log panel too (same live-event path as own dice rolls).
    setLogLiveEvents((prev) => [...prev, event]);
  };

  const handlePublishPublicInfo = async (input: { title?: string; body: string }) => {
    await appendNote({
      kind: 'host.note',
      text: input.title ? `【${input.title}】${input.body}` : input.body,
      payload: { noteKind: 'publicInfo', title: input.title, body: input.body },
    });
  };

  const handleRecordStateChange = async (input: { targetName?: string; body: string }) => {
    await appendNote({
      kind: 'state.manualChange',
      text: input.targetName ? `${input.targetName}：${input.body}` : input.body,
      payload: { noteKind: 'manualState', targetName: input.targetName, body: input.body },
    });
  };

  const publicInfoItems: RuntimePublicInfoItem[] = noteEvents
    .filter((e) => e.kind === 'host.note')
    .map((e) => {
      const p = (e.payload ?? {}) as { title?: string; body?: string };
      return { id: e.eventId, title: p.title, body: p.body ?? e.text ?? '', createdAt: e.createdAt, authorLabel: '主持人' };
    });

  const stateLogItems: RuntimeStateLogItem[] = noteEvents
    .filter((e) => e.kind === 'state.manualChange')
    .map((e) => {
      const p = (e.payload ?? {}) as { targetName?: string; body?: string };
      return { id: e.eventId, targetName: p.targetName, body: p.body ?? e.text ?? '', createdAt: e.createdAt };
    });

  const members = room?.members ?? [];
  const actorBindings = room?.lobby?.actorBindings ?? [];
  const readyStates = room?.lobby?.readyStates ?? [];

  const activeCount = members.filter((m) => m.status === 'active').length;
  const approvedCount = actorBindings.filter((b) => b.status === 'approved').length;
  const readyCount = members.filter((m) => {
    const b = actorBindings.find((x) => x.memberId === m.memberId);
    const r = readyStates.find((x) => x.memberId === m.memberId)?.status;
    return m.status === 'active' && b?.status === 'approved' && r === 'ready';
  }).length;

  const shellMode = entryModeToShellMode(context.entryMode);
  const card = 'rounded border border-slate-400/30 bg-white/60 p-3';
  const label = 'text-[11px] font-bold uppercase tracking-wide text-slate-600';

  // ── Left rail: my entry context (actor binding + ready) ────────────────────
  const actorRail = (
    <div className="space-y-2">
      <div className="text-[11px]">
        <div className="font-bold text-slate-800">{ENTRY_MODE_LABEL[context.entryMode]}</div>
        <div className="text-[10px] text-slate-500">{context.currentRole} · {shortId(context.currentMemberId)}</div>
      </div>
      <div className={card}>
        <div className={`mb-1 ${label}`}>角色绑定</div>
        {context.actorRef ? (
          <div>
            <div className="font-bold text-slate-800">{context.actorRef.displayName}</div>
            <div className="text-[10px] text-slate-500">
              {context.actorRef.systemId}{context.actorRef.actorId ? ` · ${context.actorRef.actorId}` : ''}
            </div>
            {context.approvedActorBindingId && <div className="text-[9px] text-slate-400">binding {shortId(context.approvedActorBindingId)}</div>}
            {context.admissionId && <div className="text-[9px] text-slate-400">admission {shortId(context.admissionId)}</div>}
          </div>
        ) : (
          <div className="text-[11px] italic text-slate-500">无已准入角色（主持人 / 旁观预览可无角色）。</div>
        )}
        <div className="mt-1 text-[11px]">准备：<span className="font-bold">{context.readyState ? READY_LABEL[context.readyState] : '—'}</span></div>
      </div>
    </div>
  );

  // ── Right inspector: mode-differentiated ───────────────────────────────────
  const inspector = (
    <div className="space-y-2">
      {notesError && (
        <div className="rounded border border-amber-500/40 bg-amber-50/80 px-2 py-1.5 text-[10px] leading-relaxed text-amber-800">
          房间服务连接异常，实时同步可能不可用。已有内容仍可查看；可点击面板中的「刷新」重试，或确认房间服务在线。
        </div>
      )}
      <div className={card}>
        <div className={`mb-1 ${label}`}>房间概览</div>
        <div className="flex flex-wrap gap-3 text-[11px]">
          <span>在线 <b className="text-slate-800">{activeCount}</b></span>
          <span>已准入角色 <b className="text-slate-800">{approvedCount}</b></span>
          <span>已准备 <b className="text-slate-800">{readyCount}</b></span>
        </div>
      </div>
      {shellMode === 'host' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>主持台</div>
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div>身份：<b>主持人</b></div>
            <div>当前场景：<span className="text-slate-500">未设置</span></div>
            <div>公开信息 <b>{publicInfoItems.length}</b> 条 · 状态记录 <b>{stateLogItems.length}</b> 条</div>
          </div>
          <p className="mt-1.5 border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-500">
            下一步：用底部「公开信息」发布场景与线索，用「状态记录」记下伤害和关键变化，日志抽屉可回看全程。
          </p>
        </div>
      )}
      {shellMode === 'player' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>我的信息</div>
          <div className="space-y-0.5 text-[11px] text-slate-700">
            <div>身份：<b>玩家</b></div>
            <div>角色：<b>{context.actorRef?.displayName ?? '未绑定'}</b></div>
          </div>
          <p className="mt-1.5 border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-500">
            你可以：投骰、查看主持人发布的公开信息、在日志抽屉回看全程。
          </p>
        </div>
      )}
      {shellMode === 'spectator' && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>旁观视角</div>
          <div className="text-[11px] text-slate-700">身份：<b>旁观者</b>（只读）</div>
          <p className="mt-1.5 border-t border-slate-300/40 pt-1.5 text-[10px] leading-relaxed text-slate-500">
            你可以查看公开信息和日志，但不能投骰或修改任何内容。
          </p>
        </div>
      )}
      {context.campaignRef && (
        <div className={card}>
          <div className={`mb-1 ${label}`}>战役关联</div>
          <div className="text-[11px] font-bold text-slate-800">{context.campaignRef.displayName}</div>
          <div className="text-[10px] text-slate-500">
            {CAMPAIGN_SOURCE_LABEL[context.campaignRef.source]} · {context.campaignRef.systemId}
          </div>
        </div>
      )}
    </div>
  );

  // ── Main stage: entry context + not-yet-runtime notice ─────────────────────
  const mainStage = (
    // Preview canvas fills the stage; notice + entry context are light centered
    // content (no full-width banner, no absolute corner that collides with overlays).
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-400/50 bg-white/30 p-4 text-center">
      <div className="text-base font-bold text-slate-600">地图 / 场景桌面（预览）· Map / Scene Canvas</div>
      <p className="mx-auto mt-2 max-w-md text-[11px] leading-relaxed text-slate-500">进入正式 Runtime 后显示地图与 token。当前为入口预览。</p>
      <div className="mt-3 inline-block rounded border border-amber-500/30 bg-amber-50/70 px-2 py-1 text-[9px] text-amber-700">
        只读预览 · 未接入正式 Runtime / 地图 / 日志
      </div>
      <div className="mt-3 grid max-w-sm grid-cols-2 gap-x-4 gap-y-0.5 text-left">
        <Info k="房间码" v={context.roomCode} strong />
        <Info k="系统" v={context.systemId} />
        <Info k="roomId" v={shortId(context.roomId)} />
        <Info k="服务器" v={serverLabel ?? context.serverBaseUrl} />
        {typeof context.serverSeqAtEntry === 'number' && <Info k="快照 seq" v={String(context.serverSeqAtEntry)} />}
      </div>
    </div>
  );

  return (
    <RuntimeFullscreenShell
      title={context.campaignRef?.displayName ?? `房间 ${context.roomCode}`}
      systemId={context.systemId}
      mode={shellMode}
      roomCode={context.roomCode}
      sceneLabel="入口预览"
      onExit={onBackToLobby}
      exitLabel="返回房间大厅"
      mainStage={mainStage}
      actorRail={actorRail}
      inspector={inspector}
      actionDock={
        <RuntimeActionDock
          actions={buildRuntimeDockActions(
            shellMode,
            <SharedDiceDock canRoll={!!context.currentMemberId} onRoll={handleRoomDiceRoll} />,
            {
              publicInfoPanel: (
                <RuntimePublicInfoPanel
                  canPublish={shellMode === 'host' && !!context.currentMemberId}
                  items={publicInfoItems}
                  onPublish={handlePublishPublicInfo}
                  onRefresh={loadNotes}
                  loading={notesLoading}
                  feedError={notesError}
                />
              ),
              stateLogPanel:
                shellMode === 'host' ? (
                  <RuntimeManualStateLogPanel
                    canEdit={!!context.currentMemberId}
                    items={stateLogItems}
                    onRecord={handleRecordStateChange}
                    onRefresh={loadNotes}
                    loading={notesLoading}
                    feedError={notesError}
                  />
                ) : undefined,
            },
          )}
        />
      }
      logDrawer={
        <RoomRuntimeLogPreviewPanel
          roomId={context.roomId}
          baseUrl={context.serverBaseUrl}
          currentMemberId={context.currentMemberId}
          canAppend={!!context.currentMemberId}
          liveEvents={logLiveEvents}
          onConsumedLiveEvents={() => setLogLiveEvents([])}
          defaultCollapsed={false}
        />
      }
    />
  );
}

function Info({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="min-w-[64px] text-[10px] text-slate-500">{k}</span>
      <span className={strong ? 'text-sm font-black text-slate-800' : 'text-[12px] text-slate-700'}>{v}</span>
    </div>
  );
}
