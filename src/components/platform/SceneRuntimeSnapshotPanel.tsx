import { useMemo, useState } from 'react';
import { createTranslator, type Locale } from '../../i18n';
import type { CombatRuntimeTableState } from '../../lib/combat/combatRuntimeTypes';
import type { MapBoardState } from '../../lib/map/mapRuntimeTypes';
import {
  createSceneRuntimeSnapshot,
  importSceneRuntimeSnapshot,
  summarizeSceneRuntimeSnapshot,
} from '../../lib/scene/sceneRuntimeSnapshot';
import type { SceneRuntimeSnapshot, SceneRuntimeSnapshotContext } from '../../lib/scene/sceneRuntimeSnapshotTypes';

type Props = {
  locale: Locale;
  canManage: boolean;
  context: SceneRuntimeSnapshotContext;
  combatState: CombatRuntimeTableState;
  mapBoard?: MapBoardState;
  onApply: (snapshot: SceneRuntimeSnapshot) => void;
  onAppendEvent?: (eventKind: 'scene.snapshot_exported' | 'scene.snapshot_imported', payload: Record<string, unknown>) => Promise<void>;
};

function downloadJson(serialized: string): void {
  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `scene-runtime-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SceneRuntimeSnapshotPanel({ locale, canManage, context, combatState, mapBoard, onApply, onAppendEvent }: Props) {
  const { t } = createTranslator(locale);
  const [serialized, setSerialized] = useState('');
  const [notice, setNotice] = useState('');
  const [validationNotice, setValidationNotice] = useState('');
  const [pendingSnapshot, setPendingSnapshot] = useState<SceneRuntimeSnapshot | null>(null);

  const currentSnapshot = useMemo(
    () => createSceneRuntimeSnapshot({ context, combat: combatState, map: mapBoard }),
    [combatState, context, mapBoard],
  );

  if (!canManage) return null;

  const summaryText = (snapshot: SceneRuntimeSnapshot) => {
    const summary = summarizeSceneRuntimeSnapshot(snapshot);
    return `${t('sceneSnapshot.combatants')}: ${summary.combatantCount} · ${t('sceneSnapshot.tokens')}: ${summary.tokenCount} · ${t('sceneSnapshot.mapBackground')}: ${summary.hasMapBackground ? t('sceneSnapshot.included') : t('sceneSnapshot.notIncluded')}`;
  };

  const appendAuditEvent = async (eventKind: 'scene.snapshot_exported' | 'scene.snapshot_imported', snapshot: SceneRuntimeSnapshot) => {
    if (!onAppendEvent) return;
    const summary = summarizeSceneRuntimeSnapshot(snapshot);
    try {
      await onAppendEvent(eventKind, {
        localOnly: true,
        exportedAt: snapshot.exportedAt,
        combatantCount: summary.combatantCount,
        tokenCount: summary.tokenCount,
      });
    } catch {
      setNotice(t('sceneSnapshot.eventSaveFailed'));
    }
  };

  const exportSnapshot = async () => {
    const next = createSceneRuntimeSnapshot({ context, combat: combatState, map: mapBoard });
    setSerialized(JSON.stringify(next, null, 2));
    setPendingSnapshot(next);
    setValidationNotice(summaryText(next));
    setNotice(t('sceneSnapshot.exportReady'));
    await appendAuditEvent('scene.snapshot_exported', next);
  };

  const validateInput = () => {
    try {
      const result = importSceneRuntimeSnapshot(JSON.parse(serialized), context);
      if (result.ok === false) {
        setPendingSnapshot(null);
        setValidationNotice(t('sceneSnapshot.invalid'));
        return;
      }
      setPendingSnapshot(result.snapshot);
      const warnings = result.warnings.length > 0 ? ` ${t('sceneSnapshot.contextMismatch')}` : '';
      setValidationNotice(`${summaryText(result.snapshot)}${warnings}`);
      setNotice(t('sceneSnapshot.valid'));
    } catch {
      setPendingSnapshot(null);
      setValidationNotice(t('sceneSnapshot.invalid'));
    }
  };

  const applySnapshot = async () => {
    if (!pendingSnapshot) return;
    onApply(pendingSnapshot);
    setNotice(t('sceneSnapshot.applied'));
    await appendAuditEvent('scene.snapshot_imported', pendingSnapshot);
  };

  const copySnapshot = async () => {
    if (!serialized) await exportSnapshot();
    const content = serialized || JSON.stringify(currentSnapshot, null, 2);
    try {
      await navigator.clipboard.writeText(content);
      setNotice(t('sceneSnapshot.copied'));
    } catch {
      setNotice(t('sceneSnapshot.copyFailed'));
    }
  };

  const pasteSnapshot = async () => {
    try {
      const content = await navigator.clipboard.readText();
      setSerialized(content);
      setPendingSnapshot(null);
      setValidationNotice('');
    } catch {
      setNotice(t('sceneSnapshot.pasteFailed'));
    }
  };

  const downloadSnapshot = () => {
    const content = serialized || JSON.stringify(currentSnapshot, null, 2);
    downloadJson(content);
    setNotice(t('sceneSnapshot.downloaded'));
  };

  return (
    <section className="mt-5 rounded-2xl border border-[#2f2a22]/12 bg-[#f7f3ea] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{t('sceneSnapshot.eyebrow')}</div>
          <h4 className="mt-1 text-xl font-black">{t('sceneSnapshot.title')}</h4>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#51483d]">{t('sceneSnapshot.note')}</p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2 text-xs text-[#51483d]">{summaryText(currentSnapshot)}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void exportSnapshot()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white">{t('sceneSnapshot.export')}</button>
        <button type="button" onClick={() => void copySnapshot()} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('sceneSnapshot.copy')}</button>
        <button type="button" onClick={downloadSnapshot} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('sceneSnapshot.download')}</button>
        <button type="button" onClick={() => void pasteSnapshot()} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('sceneSnapshot.paste')}</button>
      </div>

      <textarea value={serialized} onChange={(event) => { setSerialized(event.target.value); setPendingSnapshot(null); setValidationNotice(''); }} placeholder={t('sceneSnapshot.pastePlaceholder')} className="mt-3 min-h-32 w-full rounded-xl border border-[#2f2a22]/15 bg-white p-3 font-mono text-xs leading-5" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={validateInput} disabled={!serialized.trim()} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">{t('sceneSnapshot.validate')}</button>
        <button type="button" onClick={() => void applySnapshot()} disabled={!pendingSnapshot} className="rounded-md bg-[#58180d] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{t('sceneSnapshot.apply')}</button>
        <button type="button" onClick={() => { setSerialized(''); setPendingSnapshot(null); setValidationNotice(''); setNotice(''); }} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-xs font-bold">{t('sceneSnapshot.clear')}</button>
      </div>
      {validationNotice && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-[#51483d]">{validationNotice}</p>}
      {notice && <p className="mt-2 text-xs text-[#51483d]">{notice}</p>}
      <p className="mt-3 text-[11px] leading-5 text-[#51483d]">{t('sceneSnapshot.localOnlyWarning')}</p>
    </section>
  );
}
