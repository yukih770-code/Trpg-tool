import { ChevronRight, LayoutDashboard, Settings } from 'lucide-react';
import type { Locale } from '../../i18n';
import type { WorldServerGameSystemBinding } from '../../lib/api/worldServerApiClient';
import { ServerCampaignWorkspace } from './ServerCampaignWorkspace';

type Props = {
  locale: Locale;
  worldServerId: string;
  serverName: string;
  memberCount: number;
  gameSystems: WorldServerGameSystemBinding[];
  defaultGameSystemId?: string;
  canManageServer: boolean;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onSwitchServer: () => void;
  onLogout: () => void;
};

export function PlatformOperationsWorkspace({
  locale,
  worldServerId,
  serverName,
  memberCount,
  gameSystems,
  defaultGameSystemId,
  canManageServer,
  onOpenProfile,
  onOpenSettings,
  onSwitchServer,
  onLogout,
}: Props) {
  const isEn = locale === 'en';
  return (
    <section className="border-b border-[#2f2a22]/12 bg-[#fff8e6]/50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 md:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#51483d]"><LayoutDashboard className="h-3.5 w-3.5" />{isEn ? 'Platform workspace' : '平台工作台'}</div>
            <h1 className="mt-1 text-2xl font-black">{serverName}</h1>
            <p className="mt-2 text-sm text-[#51483d]">{isEn ? `${memberCount} members · Choose a campaign or room to continue.` : `${memberCount} 名成员 · 选择战役或房间继续。`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSwitchServer} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5">{isEn ? 'Switch server' : '切换服务器'}</button>
            <button type="button" onClick={onLogout} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-bold text-[#58180d] hover:bg-[#fff8e6]">{isEn ? 'Log out' : '退出登录'}</button>
            {canManageServer && <button type="button" onClick={onOpenSettings} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5"><Settings className="mr-1 inline h-4 w-4" />{isEn ? 'Manage server' : '管理服务器'}</button>}
            <button type="button" onClick={onOpenProfile} className="rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white hover:bg-[#2f2a22]">{isEn ? 'Server profile' : '服务器资料'} <ChevronRight className="ml-1 inline h-4 w-4" /></button>
          </div>
        </div>
        <ServerCampaignWorkspace
          worldServerId={worldServerId}
          locale={locale}
          gameSystems={gameSystems}
          defaultGameSystemId={defaultGameSystemId}
          canManageServer={canManageServer}
        />
      </div>
    </section>
  );
}
