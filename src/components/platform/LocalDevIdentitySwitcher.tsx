import { useMemo, useState } from 'react';
import {
  isFrontendDevelopment,
  resolveConfiguredDevViewerUserId,
  resolveDevViewerUserId,
  setDevViewerUserId,
} from '../../lib/api/apiClient';
import type { Locale } from '../../i18n';

type Props = {
  locale: Locale;
  onChanged?: () => void;
};

type DevIdentityOption = {
  id: string;
  zh: string;
  en: string;
};

export function LocalDevIdentitySwitcher({ locale, onChanged }: Props) {
  const configuredUserId = resolveConfiguredDevViewerUserId();
  const selectedUserId = resolveDevViewerUserId();
  const options = useMemo<DevIdentityOption[]>(() => {
    const hostId = configuredUserId ?? 'dev-user-001';
    return [
      { id: hostId, zh: '主持人', en: 'Host' },
      { id: 'dev-player-1', zh: '玩家 1', en: 'Player 1' },
      { id: 'dev-player-2', zh: '玩家 2', en: 'Player 2' },
    ];
  }, [configuredUserId]);
  const [selectedId, setSelectedId] = useState(selectedUserId ?? options[0].id);

  if (!isFrontendDevelopment() || !configuredUserId) return null;

  const label = locale === 'en' ? 'Local dev identity' : '本地开发身份';
  const note = locale === 'en' ? 'This is not real sign-in.' : '这不是正式登录。';

  return (
    <div className="rounded-xl border border-dashed border-[#2f2a22]/20 bg-white/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">{label}</h2>
          <p className="mt-1 text-xs text-[#51483d]">{note}</p>
        </div>
        <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1 text-[11px] font-bold text-[#51483d]">DEV</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={selectedId}
          onChange={(event) => {
            const nextId = event.target.value;
            setSelectedId(nextId);
            setDevViewerUserId(nextId);
            onChanged?.();
          }}
          className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm"
          aria-label={label}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {locale === 'en' ? option.en : option.zh}
            </option>
          ))}
        </select>
        <span className="text-xs text-[#51483d]">
          {locale === 'en' ? 'API requests use the selected dev viewer.' : 'API 请求会使用当前开发身份。'}
        </span>
      </div>
    </div>
  );
}
