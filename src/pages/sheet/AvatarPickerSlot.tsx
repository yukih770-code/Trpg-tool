import { useRef, type ChangeEvent } from 'react';

/**
 * AvatarPickerSlot
 *
 * Reusable avatar / portrait slot. Displays the current image (or a placeholder)
 * and a "change image" control. Designed to be reused for BOTH character
 * portraits (mode="character") and future account avatars (mode="account").
 *
 * Persistence boundary: this component does NOT upload or store binaries. When
 * `onChangeImage` is provided it emits a client-side object URL (preview only);
 * when omitted (or `readOnly`), it shows a disabled "pending" control. Real
 * persistence requires the MediaAsset / ActorMediaBinding layer (future work).
 */
export interface AvatarPickerSlotProps {
  label: string;
  imageUrl?: string;
  altText?: string;
  mode?: 'character' | 'account';
  onChangeImage?: (next: { imageUrl?: string; mediaAssetId?: string }) => void;
  readOnly?: boolean;
  className?: string;
  accentClassName?: string;
}

export function AvatarPickerSlot({
  label,
  imageUrl,
  altText,
  mode = 'character',
  onChangeImage,
  readOnly,
  className,
  accentClassName,
}: AvatarPickerSlotProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canChange = !readOnly && typeof onChangeImage === 'function';

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || !onChangeImage) return;
    onChangeImage({ imageUrl: URL.createObjectURL(file) });
  };

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-current/25 bg-current/5">
        {imageUrl ? (
          <img src={imageUrl} alt={altText ?? label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl opacity-40" aria-hidden="true">
            ◍
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className={`text-[11px] font-bold uppercase tracking-[0.16em] ${accentClassName ?? ''}`}>{label}</div>
        <div className="mt-0.5 text-[10px] opacity-55">
          {mode === 'account' ? '账号头像 Account avatar' : '角色立绘 / 头像 Portrait'}
        </div>
        {canChange ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-2 rounded border border-current/30 px-2 py-1 text-[11px] font-bold uppercase tracking-wider opacity-80 transition hover:opacity-100"
          >
            更换图片 Change
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="待接入 MediaAsset 持久化 / pending MediaAsset integration"
            className="mt-2 cursor-default rounded border border-current/15 px-2 py-1 text-[11px] font-bold uppercase tracking-wider opacity-40"
          >
            更换图片（待接入）Change (pending)
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="sr-only" />
      </div>
    </div>
  );
}
