import { ChevronRight, LayoutDashboard } from 'lucide-react';
import type { Locale } from '../../i18n';

type Props = {
  locale: Locale;
  serverName: string;
  memberCount: number;
  onOpenProfile: () => void;
  onOpenCampaigns: () => void;
};

export function PlatformOperationsWorkspace({
  locale,
  serverName,
  memberCount,
  onOpenProfile,
  onOpenCampaigns,
}: Props) {
  const isEn = locale === 'en';
  return (
    <section className="border-b border-[#2f2a22]/12 bg-[#fff8e6]/50">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#51483d]"><LayoutDashboard className="h-3.5 w-3.5" />{isEn ? 'Current server' : '当前服务器'}</div>
            <h1 className="mt-1 text-2xl font-black">{serverName}</h1>
            <p className="mt-2 text-sm text-[#51483d]">{isEn ? `${memberCount} members · Browse server information or continue with your personal tools below.` : `${memberCount} 名成员 · 查看服务器资料，或使用下方的个人与资料入口。`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onOpenCampaigns} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5">{isEn ? 'Campaigns & rooms' : '战役与房间'}</button>
            <button type="button" onClick={onOpenProfile} className="rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white hover:bg-[#2f2a22]">{isEn ? 'Server profile' : '服务器资料'} <ChevronRight className="ml-1 inline h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
