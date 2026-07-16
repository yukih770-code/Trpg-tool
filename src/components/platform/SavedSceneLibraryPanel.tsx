import { useMemo, useState } from 'react';

import { createTranslator, type Locale } from '../../i18n';
import { campaignRoomApiClient, type SceneStateDocument } from '../../lib/api/campaignRoomApiClient';
import { useSceneStates } from '../../lib/campaignRoom/useSceneStates';
import type { CombatRuntimeTableState } from '../../lib/combat/combatRuntimeTypes';
import type { MapBoardState } from '../../lib/map/mapRuntimeTypes';
import {
  createSceneRuntimeSnapshot,
  importSceneRuntimeSnapshot,
  summarizeSceneRuntimeSnapshot,
} from '../../lib/scene/sceneRuntimeSnapshot';
import type { SceneRuntimeSnapshot, SceneRuntimeSnapshotContext } from '../../lib/scene/sceneRuntimeSnapshotTypes';

type SceneStateEventKind = 'scene.state_saved' | 'scene.state_loaded' | 'scene.state_archived' | 'scene.state_duplicated';

type Props = {
  locale: Locale;
  worldServerId: string;
  campaignId: string;
  roomId: string;
  runtimeSessionId?: string;
  canManage: boolean;
  context: SceneRuntimeSnapshotContext;
  combatState: CombatRuntimeTableState;
  mapBoard?: MapBoardState;
  onApply: (snapshot: SceneRuntimeSnapshot) => void;
  onAppendEvent?: (eventKind: SceneStateEventKind, payload: Record<string, unknown>) => Promise<void>;
};

function sceneDetails(document: SceneStateDocument) {
  const result = importSceneRuntimeSnapshot(document.stateJson);
  return result.ok === false ? null : summarizeSceneRuntimeSnapshot(result.snapshot);
}

export function SavedSceneLibraryPanel({
  locale,
  worldServerId,
  campaignId,
  roomId,
  runtimeSessionId,
  canManage,
  context,
  combatState,
  mapBoard,
  onApply,
  onAppendEvent,
}: Props) {
  const { t } = createTranslator(locale);
  const { sceneStates, loading, error, refresh } = useSceneStates(worldServerId, campaignId, roomId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const [pendingSnapshot, setPendingSnapshot] = useState<SceneRuntimeSnapshot | null>(null);
  const [pendingDocument, setPendingDocument] = useState<SceneStateDocument | null>(null);
  const [pendingWarnings, setPendingWarnings] = useState(false);
  const [editing, setEditing] = useState<SceneStateDocument | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const currentSnapshot = useMemo(
    () => createSceneRuntimeSnapshot({ context, combat: combatState, map: mapBoard }),
    [combatState, context, mapBoard],
  );

  const appendEvent = async (eventKind: SceneStateEventKind, document: SceneStateDocument) => {
    if (!onAppendEvent) return;
    try {
      await onAppendEvent(eventKind, {
        sceneStateId: document.sceneStateId,
        title: document.title,
        sourceSceneStateId: document.sourceSceneStateId,
      });
    } catch {
      setNotice(t('sceneLibrary.eventDeferred'));
    }
  };

  const saveCurrent = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setNotice(t('sceneLibrary.titleRequired'));
      return;
    }
    setBusyId('save');
    setNotice('');
    try {
      const document = await campaignRoomApiClient.createSceneState(worldServerId, campaignId, roomId, {
        title: nextTitle,
        description: description.trim() || undefined,
        runtimeSessionId,
        stateJson: currentSnapshot,
      });
      setTitle('');
      setDescription('');
      await refresh();
      setNotice(t('sceneLibrary.saved'));
      await appendEvent('scene.state_saved', document);
    } catch {
      setNotice(t('sceneLibrary.saveFailed'));
    } finally {
      setBusyId('');
    }
  };

  const prepareLoad = async (document: SceneStateDocument) => {
    setBusyId(document.sceneStateId);
    setNotice('');
    setPendingSnapshot(null);
    setPendingDocument(null);
    try {
      const detail = await campaignRoomApiClient.getSceneState(worldServerId, campaignId, roomId, document.sceneStateId);
      const result = importSceneRuntimeSnapshot(detail.stateJson, context);
      if (result.ok === false) {
        setNotice(t('sceneLibrary.invalid'));
        return;
      }
      setPendingSnapshot(result.snapshot);
      setPendingDocument(detail);
      setPendingWarnings(result.warnings.length > 0);
      setNotice(result.warnings.length > 0 ? t('sceneLibrary.contextWarning') : t('sceneLibrary.readyToApply'));
    } catch {
      setNotice(t('sceneLibrary.loadFailed'));
    } finally {
      setBusyId('');
    }
  };

  const applyPrepared = async () => {
    if (!pendingSnapshot) return;
    onApply(pendingSnapshot);
    setPendingSnapshot(null);
    setPendingWarnings(false);
    setNotice(t('sceneLibrary.applied'));
    if (pendingDocument) await appendEvent('scene.state_loaded', pendingDocument);
    setPendingDocument(null);
  };

  const archive = async (document: SceneStateDocument) => {
    setBusyId(document.sceneStateId);
    try {
      const archived = await campaignRoomApiClient.archiveSceneState(worldServerId, campaignId, roomId, document.sceneStateId);
      await refresh();
      setNotice(t('sceneLibrary.archived'));
      await appendEvent('scene.state_archived', archived);
    } catch {
      setNotice(t('sceneLibrary.operationFailed'));
    } finally {
      setBusyId('');
    }
  };

  const duplicate = async (document: SceneStateDocument) => {
    setBusyId(document.sceneStateId);
    try {
      const copy = await campaignRoomApiClient.duplicateSceneState(worldServerId, campaignId, roomId, document.sceneStateId);
      await refresh();
      setNotice(t('sceneLibrary.duplicated'));
      await appendEvent('scene.state_duplicated', copy);
    } catch {
      setNotice(t('sceneLibrary.operationFailed'));
    } finally {
      setBusyId('');
    }
  };

  const rename = async () => {
    if (!editing || !editTitle.trim()) return;
    setBusyId(editing.sceneStateId);
    try {
      await campaignRoomApiClient.updateSceneState(worldServerId, campaignId, roomId, editing.sceneStateId, { title: editTitle.trim() });
      setEditing(null);
      await refresh();
      setNotice(t('sceneLibrary.renamed'));
    } catch {
      setNotice(t('sceneLibrary.operationFailed'));
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="mt-5 rounded-2xl border border-[#2f2a22]/12 bg-[#f7f3ea] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('sceneLibrary.eyebrow')}</div>
          <h4 className="mt-1 text-xl font-black">{t('sceneLibrary.title')}</h4>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">{t('sceneLibrary.note')}</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('sceneLibrary.refresh')}</button>
      </div>

      {canManage && <div className="mt-4 grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-[1fr_1fr_auto]">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('sceneLibrary.titlePlaceholder')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('sceneLibrary.descriptionPlaceholder')} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" />
        <button type="button" disabled={busyId !== ''} onClick={() => void saveCurrent()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('sceneLibrary.saveCurrent')}</button>
      </div>}

      {loading && <p className="mt-3 text-sm text-[#51483d]">{t('sceneLibrary.loading')}</p>}
      {error && <p className="mt-3 text-sm text-[#8b3a2f]">{t('sceneLibrary.loadFailed')}</p>}
      {!loading && !error && sceneStates.length === 0 && <p className="mt-3 rounded-xl bg-white px-3 py-4 text-sm text-[#51483d]">{t('sceneLibrary.empty')}</p>}
      <div className="mt-3 space-y-2">
        {sceneStates.map((document) => {
          const details = sceneDetails(document);
          return <div key={document.sceneStateId} className="rounded-xl border border-[#2f2a22]/10 bg-white p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><div className="font-bold">{document.title}</div>{document.description && <p className="mt-1 text-xs text-[#51483d]">{document.description}</p>}<p className="mt-1 text-[11px] text-[#51483d]">{details ? `${t('sceneLibrary.combatants')}: ${details.combatantCount} · ${t('sceneLibrary.tokens')}: ${details.tokenCount} · ${t('sceneLibrary.mapBackground')}: ${details.hasMapBackground ? t('sceneLibrary.included') : t('sceneLibrary.notIncluded')} · ${t('sceneLibrary.schema')}: ${document.schemaVersion}` : t('sceneLibrary.invalid')}</p>{document.updatedAt && <p className="mt-1 text-[11px] text-[#51483d]">{t('sceneLibrary.updated')}: {new Date(document.updatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN')}</p>}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busyId !== ''} onClick={() => void prepareLoad(document)} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('sceneLibrary.load')}</button>
              {canManage && <><button type="button" disabled={busyId !== ''} onClick={() => { setEditing(document); setEditTitle(document.title); }} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold disabled:opacity-40">{t('sceneLibrary.rename')}</button><button type="button" disabled={busyId !== ''} onClick={() => void duplicate(document)} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold disabled:opacity-40">{t('sceneLibrary.duplicate')}</button><button type="button" disabled={busyId !== ''} onClick={() => void archive(document)} className="rounded-md border border-[#8b3a2f]/30 px-3 py-2 text-xs font-bold text-[#8b3a2f] disabled:opacity-40">{t('sceneLibrary.archive')}</button></>}
            </div>
          </div>
        </div>;
        })}
      </div>

      {editing && <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-white p-3"><input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="min-w-48 flex-1 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-sm" /><button type="button" onClick={() => void rename()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white">{t('sceneLibrary.confirmRename')}</button><button type="button" onClick={() => setEditing(null)} className="rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold">{t('sceneLibrary.cancel')}</button></div>}
      {pendingSnapshot && <div className="mt-3 rounded-xl border border-[#b27a2b]/30 bg-[#fff8e6] p-3 text-xs text-[#51483d]"><p>{pendingWarnings ? t('sceneLibrary.contextWarning') : t('sceneLibrary.readyToApply')}</p><button type="button" onClick={() => void applyPrepared()} className="mt-2 rounded-md bg-[#58180d] px-3 py-2 text-xs font-bold text-white">{t('sceneLibrary.apply')}</button></div>}
      {notice && <p className="mt-3 text-xs text-[#51483d]">{notice}</p>}
      <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('sceneLibrary.overwriteWarning')}</p>
      <p className="mt-1 text-[11px] leading-5 text-[#51483d]">{t('sceneLibrary.boundary')}</p>
    </section>
  );
}
