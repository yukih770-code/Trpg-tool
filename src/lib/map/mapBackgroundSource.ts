/**
 * What a map background reference is allowed to be.
 *
 * AI-LANDMARK: MAP_BACKGROUND_SOURCE_GUARD_V1
 *
 * `MapBoardState.backgroundUrl` is a plain string that is persisted into the
 * `map.background_set` event and replayed on every client and after restart.
 * That makes some values actively wrong to accept:
 *
 *   file:///...  C:\...  blob:...  data:...
 *
 * A local path or an object URL resolves only inside the browser tab that
 * produced it, so persisting one stores a reference that is already broken for
 * every other player and broken for the author after a reload. This guard keeps
 * those out of the durable record.
 *
 * Local images use the Platform Asset picker and backgroundAssetId. This guard
 * validates only the compatible external-URL path.
 *
 * Pure: no React, no I/O, no storage.
 */

export type MapBackgroundRejection =
  | 'empty'
  | 'localFilePath'
  | 'objectUrl'
  | 'inlineData'
  | 'unsupportedScheme';

export type MapBackgroundSourceCheck =
  | { ok: true; url: string }
  | { ok: false; reason: MapBackgroundRejection };

const WINDOWS_PATH = /^[a-zA-Z]:[\\/]/;

export function checkMapBackgroundSource(raw: string): MapBackgroundSourceCheck {
  const value = raw.trim();
  if (!value) return { ok: false, reason: 'empty' };

  const lower = value.toLowerCase();
  if (lower.startsWith('file:') || WINDOWS_PATH.test(value) || value.startsWith('\\\\')) {
    return { ok: false, reason: 'localFilePath' };
  }
  if (lower.startsWith('blob:')) return { ok: false, reason: 'objectUrl' };
  if (lower.startsWith('data:')) return { ok: false, reason: 'inlineData' };
  if (lower.startsWith('http://') || lower.startsWith('https://')) return { ok: true, url: value };
  // A protocol-relative or site-relative reference still resolves for everyone
  // who loads the same deployment, so it stays acceptable.
  if (value.startsWith('//') || value.startsWith('/')) return { ok: true, url: value };
  return { ok: false, reason: 'unsupportedScheme' };
}

export function mapBackgroundRejectionText(reason: MapBackgroundRejection, locale: 'zh-CN' | 'en'): string {
  const en = locale === 'en';
  switch (reason) {
    case 'empty':
      return en ? 'Enter an image address.' : '请填写图片地址。';
    case 'localFilePath':
      return en
        ? 'Use Upload local file to share an image from your computer, or enter an https:// image address.'
        : '请用「上传本地文件」分享电脑上的图片，或填写 https:// 图片地址。';
    case 'objectUrl':
      return en
        ? 'That address only exists in this browser tab and breaks on reload. Paste an https:// address instead.'
        : '该地址只在当前浏览器标签内有效，刷新后就会失效。请改用 https:// 地址。';
    case 'inlineData':
      return en
        ? 'Inline image data is not stored in the map record. Paste an https:// address instead.'
        : '内嵌图片数据不会写入地图记录。请改用 https:// 地址。';
    default:
      return en ? 'Use an http:// or https:// image address.' : '请使用 http:// 或 https:// 图片地址。';
  }
}
