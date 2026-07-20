import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, RotateCcw, UserRoundPlus } from 'lucide-react';

import { type Locale } from '../../i18n';
import { ApiClientError } from '../../lib/api/apiTypes';
import {
  worldServerApiClient,
  type WorldServerInvite,
} from '../../lib/api/worldServerApiClient';

type Props = {
  worldServerId: string;
  locale: Locale;
  canManage: boolean;
};

function formatDate(value: string | undefined, locale: Locale): string {
  if (!value) return locale === 'en' ? 'No expiry' : '长期有效';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === 'en' ? 'Unknown expiry' : '有效期未知';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'zh-CN', { dateStyle: 'medium' }).format(date);
}

function inviteStatus(invite: WorldServerInvite, locale: Locale): string {
  if (invite.inviteStatus === 'active') return locale === 'en' ? 'Ready to share' : '等待使用';
  if (invite.inviteStatus === 'used') return locale === 'en' ? 'Assigned to a member' : '已绑定成员';
  if (invite.inviteStatus === 'revoked') return locale === 'en' ? 'Revoked' : '已撤销';
  return invite.inviteStatus;
}

function errorMessage(error: unknown, locale: Locale): string {
  if (error instanceof ApiClientError) {
    if (error.statusCode === 401 || error.statusCode === 403) return locale === 'en' ? 'Only the owner or an administrator can manage invites.' : '仅服主或管理员可以管理邀请码。';
    if (error.statusCode === 503) return locale === 'en' ? 'Invite service is temporarily unavailable.' : '邀请码服务暂时不可用。';
  }
  return locale === 'en' ? 'Could not update invitations. Please try again.' : '无法更新邀请码，请稍后重试。';
}

/** Compact server-settings surface for private, one-person alpha invitations. */
export function ServerInvitePanel({ worldServerId, locale, canManage }: Props) {
  const [invites, setInvites] = useState<WorldServerInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!canManage || !worldServerId) return;
    setLoading(true);
    setError(null);
    try {
      setInvites(await worldServerApiClient.listInvites(worldServerId));
    } catch (reason) {
      setError(errorMessage(reason, locale));
    } finally {
      setLoading(false);
    }
  }, [canManage, locale, worldServerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createInvite = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const invite = await worldServerApiClient.createInvite(worldServerId, { maxUses: 1 });
      setInvites((previous) => [invite, ...previous]);
      setNotice(locale === 'en' ? 'A personal invite code is ready to copy.' : '已生成一个可复制的个人邀请码。');
    } catch (reason) {
      setError(errorMessage(reason, locale));
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async (code: string) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(code);
      setNotice(locale === 'en' ? 'Invite code copied.' : '邀请码已复制。');
    } catch {
      setNotice(locale === 'en' ? 'Copy the code manually.' : '请手动复制邀请码。');
    }
  };

  const revokeInvite = async (invite: WorldServerInvite) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const next = await worldServerApiClient.revokeInvite(worldServerId, invite.inviteId);
      setInvites((previous) => previous.map((item) => item.inviteId === next.inviteId ? next : item));
      setNotice(locale === 'en' ? 'The invite can no longer be used to sign in.' : '该邀请码已不能再用于登录。');
    } catch (reason) {
      setError(errorMessage(reason, locale));
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-[#2f2a22]/12 bg-[#f7f3ea] p-4 text-sm leading-6 text-[#51483d]">
        {locale === 'en' ? 'Only the owner or an administrator can create and manage server invitations.' : '仅服主或管理员可以创建和管理服务器邀请码。'}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-[#2f2a22]/12 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#9a6710]" />
            <h3 className="font-bold">{locale === 'en' ? 'Friend invites' : '邀请朋友'}</h3>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#51483d]">
            {locale === 'en'
              ? 'Each code is for one friend. Their first sign-in binds the code to their account and adds them to this server.'
              : '每个邀请码只给一位朋友。对方首次登录后，邀请码会绑定到该用户，并自动加入当前服务器。'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => void refresh()} className="inline-flex items-center gap-1.5 rounded-md border border-[#2f2a22]/15 px-3 py-2 text-xs font-bold text-[#51483d] hover:bg-[#f7f3ea] disabled:opacity-50">
            <RotateCcw className="h-3.5 w-3.5" />{locale === 'en' ? 'Refresh' : '刷新'}
          </button>
          <button type="button" disabled={busy} onClick={() => void createInvite()} className="inline-flex items-center gap-1.5 rounded-md bg-[#17130f] px-3 py-2 text-xs font-bold text-white hover:bg-[#2f2a22] disabled:opacity-50">
            <UserRoundPlus className="h-3.5 w-3.5" />{locale === 'en' ? 'Create invite' : '创建邀请码'}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 rounded-md bg-[#fff1ee] px-3 py-2 text-sm text-[#8b3a2f]">{error}</p>}
      {notice && <p className="mt-3 rounded-md bg-[#eef7ed] px-3 py-2 text-sm text-[#37623a]">{notice}</p>}
      <p className="mt-3 text-xs leading-5 text-[#51483d]">
        {locale === 'en'
          ? 'Revoking a code stops future sign-ins with it. It does not remove an existing member or end their current session.'
          : '撤销邀请码只会阻止后续用码登录；不会自动移除已有成员，也不会中断其当前会话。'}
      </p>

      {loading && <p className="mt-4 text-sm text-[#51483d]">{locale === 'en' ? 'Loading invites…' : '正在加载邀请码……'}</p>}
      {!loading && invites.length === 0 && <p className="mt-4 rounded-lg bg-[#f7f3ea] px-3 py-3 text-sm text-[#51483d]">{locale === 'en' ? 'No personal invites yet.' : '暂时没有个人邀请码。'}</p>}
      {!loading && invites.length > 0 && (
        <div className="mt-4 space-y-2">
          {invites.map((invite) => (
            <div key={invite.inviteId} className="flex flex-col gap-3 rounded-lg border border-[#2f2a22]/10 bg-[#f7f3ea] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="rounded bg-white px-2 py-1 text-sm font-bold tracking-[0.16em] text-[#17130f]">{invite.inviteCode}</code>
                  <span className="rounded-full bg-[#2f2a22]/8 px-2 py-1 text-[10px] font-bold text-[#51483d]">{inviteStatus(invite, locale)}</span>
                </div>
                <p className="mt-1 text-xs text-[#51483d]">
                  {locale === 'en' ? `Expires: ${formatDate(invite.expiresAt, locale)}` : `有效期：${formatDate(invite.expiresAt, locale)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={() => void copyInvite(invite.inviteCode)} className="inline-flex items-center gap-1.5 rounded-md border border-[#2f2a22]/15 bg-white px-2.5 py-2 text-xs font-bold text-[#51483d] hover:bg-[#fff8e6]">
                  <Copy className="h-3.5 w-3.5" />{locale === 'en' ? 'Copy' : '复制'}
                </button>
                {invite.inviteStatus !== 'revoked' && (
                  <button type="button" disabled={busy} onClick={() => void revokeInvite(invite)} className="rounded-md border border-[#8b3a2f]/20 bg-white px-2.5 py-2 text-xs font-bold text-[#8b3a2f] hover:bg-[#fff1ee] disabled:opacity-50">
                    {locale === 'en' ? 'Revoke' : '撤销'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
