import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import { ApiError } from '../../api/client';
import { useAuth } from '../../features/auth/useAuth';
import { getMemberByIdApi } from '../../features/member/memberApi';

function getInitials(name) {
  if (!name) {
    return 'U';
  }

  return name.trim().slice(0, 2).toUpperCase();
}

function formatJoinedAt(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export default function MemberProfilePage() {
  const { memberId } = useParams();
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadMember() {
      try {
        setLoading(true);
        setErrorMessage('');
        const data = await getMemberByIdApi(memberId);
        if (mounted) {
          setMember(data);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('회원 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMember();
    return () => {
      mounted = false;
    };
  }, [memberId]);

  const reportLink = useMemo(() => {
    if (!member) {
      return '/member-reports/new';
    }

    const params = new URLSearchParams({
      memberId: member.memberId,
      nickname: member.nickname || '알 수 없는 회원',
    });

    return `/member-reports/new?${params.toString()}`;
  }, [member]);

  const isMe = user?.memberId && member?.memberId && user.memberId === member.memberId;

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        {loading ? (
          <div className="rounded-[28px] border border-violet-100 bg-white px-6 py-16 text-center text-sm font-medium text-gray-500 shadow-sm">
            회원 정보를 불러오는 중입니다...
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : !member ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 shadow-sm">
            회원 정보를 찾을 수 없습니다.
          </div>
        ) : (
          <>
            <section className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-white p-8 shadow-sm">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-600 text-2xl font-extrabold text-white shadow-lg shadow-violet-500/20">
                    {getInitials(member.nickname)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Public Profile</p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">{member.nickname}</h1>
                    <p className="mt-2 text-sm text-gray-500">{member.email}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
                      Joined {formatJoinedAt(member.createdAt)}
                    </p>
                  </div>
                </div>
                {!isMe ? (
                  <Link to={reportLink}>
                    <Button size="lg" className="min-w-40">신고하기</Button>
                  </Link>
                ) : (
                  <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-violet-700 ring-1 ring-violet-100">
                    본인 계정
                  </div>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Member ID</p>
                <p className="mt-3 break-all text-sm font-semibold text-gray-700">{member.memberId}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Role</p>
                <p className="mt-3 text-sm font-semibold text-gray-700">{member.role || '-'}</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Status</p>
                <p className="mt-3 text-sm font-semibold text-gray-700">{member.status || '-'}</p>
              </div>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
