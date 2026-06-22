import { useState } from 'react';

/**
 * SheetNotesEditor
 *
 * Shared read/edit control for character-sheet narrative fields (notes,
 * background, description). Default is READ-ONLY display; a small pencil button
 * switches to an edit state with Save / Cancel, then returns to read-only.
 *
 * Boundary: this is character-profile maintenance only. It calls the caller's
 * onSave with the new text; it does NOT write RuntimeLog, advance runtime state,
 * or perform any gameplay action. If onSave is omitted, the field is purely
 * read-only (and the pencil is hidden) — use that when a store update action is
 * not yet available.
 */
export interface SheetNotesEditorProps {
  value: string;
  /** Persist handler (e.g. a store updateField). Omit to render read-only. */
  onSave?: (next: string) => void;
  title?: string;
  placeholder?: string;
  emptyText?: string;
  rows?: number;
  /** Outer container theme classes. */
  className?: string;
  /** Accent classes for title / pencil. */
  accentClassName?: string;
  /** Classes for the read-only text body. */
  textClassName?: string;
  /** Classes for the textarea in edit mode. */
  textareaClassName?: string;
  /** Labels (bilingual defaults). */
  editLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
}

export function SheetNotesEditor({
  value,
  onSave,
  title,
  placeholder,
  emptyText = '—',
  rows = 8,
  className,
  accentClassName,
  textClassName,
  textareaClassName,
  editLabel = '编辑 Edit',
  saveLabel = '保存 Save',
  cancelLabel = '取消 Cancel',
}: SheetNotesEditorProps) {
  const canEdit = typeof onSave === 'function';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = () => {
    onSave?.(draft);
    setEditing(false);
  };

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-2">
        {title && (
          <h4 className={`text-[11px] font-bold uppercase tracking-[0.16em] ${accentClassName ?? ''}`}>
            {title}
          </h4>
        )}
        {canEdit && !editing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label={editLabel}
            title={editLabel}
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-current/30 text-[13px] leading-none opacity-70 transition hover:opacity-100 ${accentClassName ?? ''}`}
          >
            <span aria-hidden="true">✎</span>
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={rows}
            placeholder={placeholder}
            style={{ minHeight: '4.5rem', maxHeight: '11.25rem', overflowY: 'auto' }}
            className={
              textareaClassName ??
              'w-full resize-y rounded border border-current/25 bg-white/60 px-3 py-2 text-sm outline-none'
            }
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded border border-current/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider opacity-90 transition hover:opacity-100"
            >
              {saveLabel}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded border border-current/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider opacity-60 transition hover:opacity-90"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className={`whitespace-pre-wrap text-sm leading-relaxed ${textClassName ?? ''}`}>
          {value ? value : <span className="italic opacity-55">{emptyText}</span>}
        </div>
      )}
    </div>
  );
}
