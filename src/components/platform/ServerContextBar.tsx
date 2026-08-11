import { ChevronRight, LogOut, Server, Users } from 'lucide-react';
import type { Locale } from '../../i18n';

type Props = {
  locale: Locale;
  serverName: string;
  roleLabel: string;
  memberCount?: number;
  enabledSystems?: string[];
  onOpenProfile: () => void;
  onOpenCampaigns: () => void;
  onExitServer: () => void;
};

export function ServerContextBar({
  locale,
  serverName,
  roleLabel,
  memberCount,
  enabledSystems = [],
  onOpenProfile,
  onOpenCampaigns,
  onExitServer,
}: Props) {
  const isEn = locale === 'en';
  const systemSummary = enabledSystems.length > 0
    ? enabledSystems.slice(0, 2).join(' · ')
    : isEn ? 'Systems follow server settings' : '系统跟随服务器设置';

  return (
    <section className="border-b border-[#2f2a22]/12 bg-white/92 text-[#17130f] shadow-[0_1px_0_rgba(47,42,34,0.04)]">
      <div className="mx-auto flex min-h-12 w-full max-w-7xl items-center gap-3 px-3 py-2 md:px-8">
        <button
          type="button"
          onClick={onOpenProfile}
          className="group flex min-w-0 items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a66b12]/45"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f5c518]/14 text-[#7a5700]">
            <Server className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-[#6a5f52]">
              {isEn ? 'Current server' : '当前服务器'}
            </span>
            <span className="flex min-w-0 items-center gap-1 text-sm font-black">
              <span className="truncate">{serverName}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6a5f52] transition group-hover:translate-x-0.5" />
            </span>
          </span>
        </button>

        <div className="hidden min-w-0 items-center gap-2 text-[11px] text-[#6a5f52] lg:flex">
          <span className="rounded-full bg-[#2f2a22]/6 px-2 py-1 font-semibold">{roleLabel}</span>
          {typeof memberCount === 'number' && (
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Users className="h-3.5 w-3.5" />
              {isEn ? `${memberCount} members` : `${memberCount} 名成员`}
            </span>
          )}
          <span className="max-w-64 truncate">{systemSummary}</span>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenCampaigns}
            className="rounded-md bg-[#17130f] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#2f2a22]"
          >
            {isEn ? 'Campaigns & rooms' : '战役与房间'}
          </button>
          <button
            type="button"
            onClick={onExitServer}
            aria-label={isEn ? 'Switch server' : '切换服务器'}
            title={isEn ? 'Switch server' : '切换服务器'}
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-[#2f2a22]/12 text-[#6a5f52] transition hover:bg-[#2f2a22]/6 sm:flex"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
