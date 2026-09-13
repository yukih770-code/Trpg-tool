import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Creator } from '../Creator';
import { useCharacterStore } from '../../store/characterStore';

/** Contextual access to the system-owned creator; no room fields or admission writes. */
export function DndCharacterCreationDialog({ onCreated, onClose }: {
  onCreated: (actorId: string) => void;
  onClose: () => void;
}) {
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const store = useCharacterStore.getState();
      // Preserve an unfinished draft. The existing creator owns all save/reset rules.
      if (store.character.isCompleted) store.resetCreator();
      setReady(true);
    }
  }, []);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="z-[160] max-h-[94dvh] overflow-y-auto sm:max-w-6xl" data-canonical-creator="dnd">
      <DialogTitle>创建角色 · D&D</DialogTitle>
      <DialogDescription>使用角色库中的同一套创建工具。完成后保存到角色库，并返回大厅选中角色；仍需提交给主持人。已有未完成草稿会在这里继续。</DialogDescription>
      <button type="button" className="w-fit rounded border px-3 py-2 text-sm" onClick={onClose}>返回大厅，稍后继续</button>
      {ready && <Creator onComplete={onCreated} />}
    </DialogContent>
  </Dialog>;
}
