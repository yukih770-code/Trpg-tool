import { BookOpen, ChevronRight, ShieldCheck, Swords, Users } from 'lucide-react';
import type { Locale } from '../../i18n';

type Props = {
  locale: Locale;
  serverName: string;
  roleLabel: string;
  memberCount: number;
  activeCampaignCount?: number;
  enabledSystems: string[];
  onOpenProfile: () => void;
  onOpenCampaigns: () => void;
};

export function PlatformOperationsWorkspace({
  locale,
  serverName,
  roleLabel,
  memberCount,
  activeCampaignCount,
  enabledSystems,
  onOpenProfile,
  onOpenCampaigns,
}: Props) {
  const isEn = locale === 'en';
  const stats = [
    {
      key: 'role',
      icon: ShieldCheck,
      label: isEn ? 'Your role' : '当前身份',
      value: roleLabel,
    },
    {
      key: 'members',
      icon: Users,
      label: isEn ? 'Members' : '服务器成员',
      value: String(memberCount),
    },
    {
      key: 'systems',
      icon: BookOpen,
      label: isEn ? 'Game systems' : '已启用系统',
      value: enabledSystems.length > 0 ? String(enabledSystems.length) : '—',
    },
  ];

  return (
    <section className="bg-[#f7f3ea]">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 md:pt-8">
        <div className="overflow-hidden rounded-2xl border border-[#2f2a22]/12 bg-[#17130f] text-white shadow-sm">
          <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/52">
                <Swords className="h-3.5 w-3.5 text-[#f5c518]" />
                {isEn ? 'Server workspace' : '服务器工作区'}
              </div>
              <h1 className="mt-2 truncate text-2xl font-black md:text-3xl">{serverName}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/68">
                {isEn
                  ? 'Open a campaign or room to prepare the table, review characters, and continue into Runtime.'
                  : '进入战役或房间，准备跑团、审核角色，并继续前往 Runtime。'}
              </p>
              {typeof activeCampaignCount === 'number' && (
                <p className="mt-3 text-xs font-semibold text-[#f5c518]">
                  {isEn ? `${activeCampaignCount} active campaigns` : `${activeCampaignCount} 个活跃战役`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <button type="button" onClick={onOpenCampaigns} className="rounded-md bg-[#f5c518] px-4 py-2.5 text-sm font-black text-[#17130f] transition hover:bg-[#f5c518]/90">
                {isEn ? 'Open campaigns & rooms' : '进入战役与房间'}
                <ChevronRight className="ml-1 inline h-4 w-4" />
              </button>
              <button type="button" onClick={onOpenProfile} className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-bold text-white/82 transition hover:bg-white/10">
                {isEn ? 'Server profile' : '服务器资料'}
              </button>
            </div>
          </div>
          <div className="grid border-t border-white/10 sm:grid-cols-3">
            {stats.map(({ key, icon: Icon, label, value }, index) => (
              <div key={key} className={`flex items-center gap-3 px-5 py-3.5 ${index > 0 ? 'border-t border-white/10 sm:border-l sm:border-t-0' : ''}`}>
                <Icon className="h-4 w-4 shrink-0 text-[#f5c518]" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</span>
                  <span className="block truncate text-sm font-bold text-white/88">{value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
