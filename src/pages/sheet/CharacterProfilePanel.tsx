import { CharacterSheetPanel } from './CharacterSheetPanel';
import { SheetNotesEditor } from './SheetNotesEditor';
import { AvatarPickerSlot } from './AvatarPickerSlot';
import {
  resolveAvatarImageUrl,
  type CharacterProfileDraft,
  type CharacterProfileFieldSupport,
} from '../../lib/platform/characterProfile';

/**
 * CharacterProfilePanel
 *
 * Shared profile surface for character sheets: avatar/portrait, appearance
 * description, biography, and notes. Default read-only; each supported text
 * field gets a pencil → Save/Cancel via SheetNotesEditor. Fields without store
 * support render a read-only "pending" hint instead of an editor.
 *
 * Display/maintenance only — no RuntimeLog, no gameplay, no image persistence.
 */
export interface CharacterProfilePanelProps {
  profile: CharacterProfileDraft;
  support: CharacterProfileFieldSupport;
  eyebrow?: string;
  title?: string;
  onChangeAvatar?: (next: { imageUrl?: string; mediaAssetId?: string }) => void;
  onSaveAppearance?: (next: string) => void;
  onSaveBiography?: (next: string) => void;
  onSaveNotes?: (next: string) => void;
  className?: string;
  headerClassName?: string;
  accentClassName?: string;
  textClassName?: string;
  textareaClassName?: string;
}

export function CharacterProfilePanel({
  profile,
  support,
  eyebrow,
  title = '角色档案 Profile',
  onChangeAvatar,
  onSaveAppearance,
  onSaveBiography,
  onSaveNotes,
  className,
  headerClassName,
  accentClassName,
  textClassName,
  textareaClassName,
}: CharacterProfilePanelProps) {
  const pendingHint = (label: string) => (
    <div>
      <h4 className={`mb-1 text-[11px] font-bold uppercase tracking-[0.16em] ${accentClassName ?? ''}`}>{label}</h4>
      <p className="text-[11px] italic opacity-55">暂无字段，需后续 store 支持。Pending store support.</p>
    </div>
  );

  return (
    <CharacterSheetPanel
      eyebrow={eyebrow}
      title={title}
      className={className}
      headerClassName={headerClassName}
      bodyClassName="space-y-4"
    >
      <AvatarPickerSlot
        label="立绘 / 头像 Portrait"
        imageUrl={resolveAvatarImageUrl(profile.avatar)}
        altText={profile.displayName}
        mode="character"
        onChangeImage={support.avatarPersistence ? onChangeAvatar : undefined}
        readOnly={!support.avatarPersistence}
        accentClassName={accentClassName}
      />

      {support.appearance ? (
        <SheetNotesEditor
          title="外貌描述 Appearance"
          value={profile.appearanceDescription ?? ''}
          onSave={onSaveAppearance}
          emptyText="尚未记录外貌描述。"
          rows={4}
          accentClassName={accentClassName}
          textClassName={textClassName}
          textareaClassName={textareaClassName}
        />
      ) : (
        pendingHint('外貌描述 Appearance')
      )}

      {support.biography ? (
        <SheetNotesEditor
          title="生平 / 描述 Biography"
          value={profile.biography ?? ''}
          onSave={onSaveBiography}
          emptyText="尚未记录生平。"
          rows={6}
          accentClassName={accentClassName}
          textClassName={textClassName}
          textareaClassName={textareaClassName}
        />
      ) : (
        pendingHint('生平 / 描述 Biography')
      )}

      {support.notes ? (
        <SheetNotesEditor
          title="备注 Notes"
          value={profile.notes ?? ''}
          onSave={onSaveNotes}
          emptyText="尚无备注。"
          rows={4}
          accentClassName={accentClassName}
          textClassName={textClassName}
          textareaClassName={textareaClassName}
        />
      ) : (
        pendingHint('备注 Notes')
      )}
    </CharacterSheetPanel>
  );
}
