import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Users, Swords, MessageSquare, BookOpen, Settings2, X, ArrowLeft } from 'lucide-react';
import type { RuntimeFullscreenShellProps } from './RuntimeFullscreenShell';
import { RUNTIME_ACTION_DOCK_DID_OPEN_EVENT, RUNTIME_AUXILIARY_PANEL_OPEN_EVENT, RUNTIME_MAP_PANEL_DID_OPEN_EVENT } from './RuntimeActionDock';
import './livePlay.css';

type Panel = 'party' | 'character' | 'combat' | 'activity' | 'prepare';
export interface LivePlayShellProps extends RuntimeFullscreenShellProps {
  panelRequest?: { panel: Panel; nonce: number };
  character?: ReactNode;
  preparation?: ReactNode;
  actionBar?: ReactNode;
  turnBar?: ReactNode;
  statusNotice?: ReactNode;
  partyCount?: number;
  activityCount?: number;
}

/** Live room layout only. Slots retain their state while supporting panels close. */
export function LivePlayShell({ title, mode, sceneLabel, connectionLabel, connectionTone,
  roomCode, onExit, mainStage, actorRail, inspector, character, preparation, actionBar,
  turnBar, statusNotice, actionDock, logDrawer, overlay, partyCount, panelRequest, activityCount = 0 }: LivePlayShellProps) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [seenActivity, setSeenActivity] = useState(activityCount);
  const trigger = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const id = useId();
  const items = [
    { id: 'party' as const, label: `队伍${partyCount === undefined ? '' : ` ${partyCount}`}`, icon: Users, body: actorRail },
    { id: 'character' as const, label: '角色卡', icon: BookOpen, body: character },
    { id: 'combat' as const, label: mode === 'host' ? '战斗 / 裁定' : '先攻', icon: Swords, body: inspector },
    { id: 'activity' as const, label: `聊天 / 动态${panel !== 'activity' && activityCount > seenActivity ? ' ·' : ''}`, icon: MessageSquare, body: logDrawer },
    { id: 'prepare' as const, label: '准备 / 管理', icon: Settings2, body: preparation },
  ].filter((item) => item.body !== undefined);
  const toggle = (next: Panel, button: HTMLElement) => {
    trigger.current = button;
    setPanel((current) => current === next ? null : next);
    window.dispatchEvent(new Event(RUNTIME_AUXILIARY_PANEL_OPEN_EVENT));
  };
  useEffect(() => {
    if (!panelRequest) return;
    trigger.current = document.activeElement as HTMLElement | null;
    setPanel(panelRequest.panel);
    window.dispatchEvent(new Event(RUNTIME_AUXILIARY_PANEL_OPEN_EVENT));
  }, [panelRequest]);
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = before; };
  }, []);
  useEffect(() => {
    if (panel === 'activity') setSeenActivity(activityCount);
    if (panel) panelRef.current?.querySelector<HTMLButtonElement>('[data-panel-close]')?.focus();
  }, [panel]);
  useEffect(() => { if (panel === 'activity') setSeenActivity(activityCount); }, [activityCount, panel]);
  useEffect(() => {
    const close = () => setPanel(null);
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPanel(null);
      trigger.current?.focus();
    };
    window.addEventListener('keydown', escape);
    window.addEventListener(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT, close);
    window.addEventListener(RUNTIME_MAP_PANEL_DID_OPEN_EVENT, close);
    return () => {
      window.removeEventListener('keydown', escape);
      window.removeEventListener(RUNTIME_ACTION_DOCK_DID_OPEN_EVENT, close);
      window.removeEventListener(RUNTIME_MAP_PANEL_DID_OPEN_EVENT, close);
    };
  }, []);
  return <div className="live-play" data-live-play={mode}>
    <header className="live-session-bar">
      {onExit && <button type="button" className="live-icon-button" onClick={onExit} aria-label="返回房间大厅" title="返回房间大厅"><ArrowLeft size={18} /></button>}
      <div className="live-session-name"><strong>{sceneLabel || title}</strong><span>{sceneLabel ? title : mode === 'host' ? '主持人' : mode === 'player' ? '玩家' : '旁观'}{roomCode ? ` · ${roomCode}` : ''}</span></div>
      <span className="live-connection" title={connectionLabel}><i data-tone={connectionTone} />{connectionLabel}</span>
      <nav aria-label="桌面面板" className="live-panel-tabs">
        {items.map((item) => <button type="button" key={item.id} aria-pressed={panel === item.id} aria-expanded={panel === item.id} aria-controls={`${id}-${item.id}`} onClick={(event) => toggle(item.id, event.currentTarget)}><item.icon size={16} /><span>{item.label}</span></button>)}
      </nav>
    </header>
    {statusNotice && <div className="live-status-notice" role="status">{statusNotice}</div>}
    {turnBar}
    <div className={`live-table-layout ${panel ? 'has-panel' : ''}`}>
      <main className="live-tabletop" aria-label="跑团桌面">{mainStage}{overlay}</main>
      <aside className="live-context-panel" hidden={!panel} ref={panelRef} aria-label={items.find((item) => item.id === panel)?.label ?? '桌面面板'}>
        <div className="live-context-heading"><strong>{items.find((item) => item.id === panel)?.label}</strong><button type="button" className="live-icon-button" data-panel-close aria-label="关闭面板" onClick={() => { setPanel(null); trigger.current?.focus(); }}><X size={18} /></button></div>
        {items.map((item) => <div className="live-context-content" id={`${id}-${item.id}`} key={item.id} hidden={panel !== item.id}>{item.body}</div>)}
      </aside>
    </div>
    <footer className="live-action-region">
      {actionBar}
      {actionDock && <div className="live-secondary-actions">{actionDock}</div>}
    </footer>
  </div>;
}
