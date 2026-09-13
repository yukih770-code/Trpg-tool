import { useMemo, useRef, useState } from 'react';
import { createAssetApiClient, type AssetViewContext } from '../../lib/api/assetApiClient';
import type { MediaAssetSummary } from '../../lib/architecture/mediaAsset';
/** One Platform picker for backgrounds and portraits. */
export function AssetPicker({ kind, context, english = false, onSelect }: {
  kind: 'map' | 'image'; context?: AssetViewContext; english?: boolean;
  onSelect: (asset: MediaAssetSummary) => void;
}) {
  const client = useMemo(() => createAssetApiClient({ baseUrl: context?.baseUrl }), [context?.baseUrl]);
  const input = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<MediaAssetSummary[]>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await work(); } catch { setError(english ? 'Could not load or upload this image. Check your connection and use PNG, JPEG or WebP up to 20 MB.' : '图片上传或读取失败。请检查连接，并使用不超过 20 MB 的 PNG、JPEG 或 WebP 图片。'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return <div className="my-3 space-y-2" aria-busy={busy}>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{english ? 'Upload local image' : '上传本地图片'}</button>
      <button type="button" disabled={busy} onClick={() => void run(async () => setAssets(await client.list()))} className="rounded-md border bg-white px-3 py-2 text-xs font-bold">{english ? 'Choose existing image' : '选择已有图片'}</button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label={english ? 'Local image' : '本地图片'} onChange={event => {
        const file = event.target.files?.[0];
        if (file) void run(async () => { if (file.size > 20 * 1024 * 1024) throw new Error('too_large'); onSelect(await client.upload(file, kind)); setAssets(undefined); });
      }} />
    </div>
    {assets && <div className="max-h-48 overflow-auto rounded-md border bg-white p-2">
      {!assets.length && <p className="text-xs">{english ? 'No uploaded images yet.' : '还没有上传的图片。'}</p>}
      {assets.map(asset => <button type="button" key={asset.id} onClick={() => { onSelect(asset); setAssets(undefined); }} className="block w-full rounded p-2 text-left text-xs hover:bg-slate-100">{asset.title} <span className="text-slate-500">{asset.width} × {asset.height}</span></button>)}
      <button type="button" onClick={() => setAssets(undefined)} className="p-2 text-xs">{english ? 'Close' : '关闭'}</button>
    </div>}
    {busy && <p role="status" className="text-xs">{english ? 'Loading image…' : '正在加载图片…'}</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
