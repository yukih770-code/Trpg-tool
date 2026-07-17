import { BookOpen, Megaphone, Settings, Users } from 'lucide-react';
import type { Locale } from '../../i18n';
import type { WorldServerGameSystemBinding, WorldServerMembership } from '../../lib/api/worldServerApiClient';

type Props = {
  locale: Locale;
  serverName: string;
  description?: string;
  roleLabel: string;
  lifecycleStatus?: string;
  members: WorldServerMembership[];
  gameSystems: WorldServerGameSystemBinding[];
  partialSync: boolean;
  canManageServer: boolean;
  onBackToWorkspace: () => void;
  onOpenSettings: () => void;
  onExitServer: () => void;
  onLogout: () => void;
};

function memberRoleLabel(roleKey: string, locale: Locale): string {
  const labels: Record<string, [string, string]> = {
    owner: ['服主', 'Owner'],
    admin: ['管理员', 'Administrator'],
    member: ['成员', 'Member'],
  };
  return labels[roleKey]?.[locale === 'en' ? 1 : 0] ?? roleKey;
}

export function ServerProfileBoard({
  locale,
  serverName,
  description,
  roleLabel,
  lifecycleStatus,
  members,
  gameSystems,
  partialSync,
  canManageServer,
  onBackToWorkspace,
  onOpenSettings,
  onExitServer,
  onLogout,
}: Props) {
  const isEn = locale === 'en';
  const enabledSystems = gameSystems.filter((system) => system.bindingStatus !== 'archived');

  return (
    <div className="min-h-screen bg-[#f7f3ea] text-[#17130f]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">
              {isEn ? 'Server profile' : '服务器资料'}
            </div>
            <h1 className="mt-1 text-3xl font-black">{serverName}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#51483d]">
              {description?.trim() || (isEn ? 'No description yet.' : '暂无简介。')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#51483d]">
              <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{isEn ? 'My role' : '我的身份'}：{roleLabel}</span>
              <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{members.length} {isEn ? 'members' : '名成员'}</span>
              {lifecycleStatus && <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{lifecycleStatus}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onExitServer} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5">
              {isEn ? 'Switch server' : '切换服务器'}
            </button>
            <button type="button" onClick={onLogout} className="rounded-md border border-[#58180d]/20 bg-white px-3 py-2 text-sm font-bold text-[#58180d] hover:bg-[#fff8e6]">
              {isEn ? 'Log out' : '退出登录'}
            </button>
            {canManageServer && (
              <button type="button" onClick={onOpenSettings} className="rounded-md border border-[#2f2a22]/15 bg-white px-3 py-2 text-sm font-bold text-[#51483d] hover:bg-[#2f2a22]/5">
                {isEn ? 'Manage server' : '管理服务器'}
              </button>
            )}
            <button type="button" onClick={onBackToWorkspace} className="rounded-md bg-[#17130f] px-3 py-2 text-sm font-bold text-white hover:bg-[#2f2a22]">
              {isEn ? 'Back to workspace' : '回到工作台'}
            </button>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-[#2f2a22]/12 bg-white shadow-sm">
          <div className="min-h-36 bg-[linear-gradient(115deg,#fff8e6,#f7f3ea_56%,#f1fbf7)] p-5 md:p-7">
            <div className="max-w-xl">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#51483d]">{isEn ? 'Server board' : '服务器概览'}</div>
              <h2 className="mt-2 text-2xl font-bold">{serverName}</h2>
              <p className="mt-2 text-sm leading-6 text-[#51483d]">{isEn ? 'Announcements, rules, members, and shared resources.' : '公告、规则、成员与共享资料。'}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="flex flex-col gap-4">
            <article className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold"><Megaphone className="h-4 w-4 text-[#58180d]" />{isEn ? 'Announcement' : '公告'}</div>
              <p className="mt-3 text-sm leading-6 text-[#51483d]">{isEn ? 'No announcement has been published.' : '暂无公告。'}</p>
            </article>
            <article className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold"><BookOpen className="h-4 w-4 text-[#2f7f68]" />{isEn ? 'Rules and resources' : '规则与资料库'}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {enabledSystems.map((system) => <span key={system.bindingId} className="rounded-full bg-[#f1fbf7] px-3 py-1 text-xs font-bold text-[#2f7f68]">{system.displayName}</span>)}
                {enabledSystems.length === 0 && <span className="text-sm text-[#51483d]">{isEn ? 'No enabled game systems.' : '暂无已启用游戏系统。'}</span>}
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-[#2f2a22]/15 bg-[#f7f3ea] p-4 text-sm text-[#51483d]">
                <div className="font-bold text-[#17130f]">{isEn ? 'Showcase image' : '展示图'}</div>
                <p className="mt-1">{isEn ? 'No showcase image yet.' : '暂未添加展示图。'}</p>
              </div>
            </article>
          </div>

          <aside className="flex flex-col gap-4">
            <article className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-[#6a5f52]" />{isEn ? 'Members' : '成员'}</div>
              <div className="mt-3 flex flex-col gap-2">
                {members.slice(0, 5).map((member) => (
                  <div key={member.membershipId} className="flex items-center justify-between gap-3 rounded-lg bg-[#f7f3ea] px-3 py-2 text-sm">
                    <span className="truncate font-semibold">{member.displayAlias?.trim() || (isEn ? 'Server member' : '服务器成员')}</span>
                    <span className="shrink-0 text-xs text-[#51483d]">{memberRoleLabel(member.roleKey, locale)}</span>
                  </div>
                ))}
                {members.length === 0 && <p className="text-sm text-[#51483d]">{isEn ? 'No member overview is available.' : '暂无成员概览。'}</p>}
              </div>
            </article>
            <article className="rounded-2xl border border-[#2f2a22]/12 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold"><Settings className="h-4 w-4 text-[#6a5f52]" />{isEn ? 'Server links' : '服务器链接'}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#51483d]">
                <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{isEn ? 'Members' : '成员'}</span>
                <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{isEn ? 'Library' : '资料库'}</span>
                <span className="rounded-full bg-[#2f2a22]/8 px-2.5 py-1">{isEn ? 'Announcements' : '公告'}</span>
              </div>
              {partialSync && <p className="mt-3 text-xs leading-5 text-[#51483d]">{isEn ? 'Some profile details are still loading.' : '部分服务器资料仍在加载。'}</p>}
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}
