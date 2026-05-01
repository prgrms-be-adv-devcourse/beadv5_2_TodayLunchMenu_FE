import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import { createMemberReport } from '../../features/report/reportApi';
import { ApiError } from '../../api/client';

const reportTypeOptions = [
  {
    value: 'SPAM',
    label: '스팸 / 홍보',
    description: '광고성 메시지, 반복 홍보, 도배 행위',
  },
  {
    value: 'ABUSE',
    label: '욕설 / 비하',
    description: '욕설, 조롱, 혐오 표현, 인신공격',
  },
  {
    value: 'FRAUD',
    label: '사기 의심',
    description: '거래 유도 후 잠적, 허위 판매, 기만 행위',
  },
  {
    value: 'ETC',
    label: '기타 사유',
    description: '위 항목으로 분류하기 어려운 부적절 행위',
  },
];

function getInitials(name) {
  if (!name) {
    return 'U';
  }

  return name.trim().slice(0, 2).toUpperCase();
}

export default function MemberReportCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reportType, setReportType] = useState('SPAM');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const target = useMemo(() => ({
    memberId: searchParams.get('memberId') || '',
    nickname: searchParams.get('nickname') || '알 수 없는 회원',
    username: searchParams.get('username') || '',
    image: searchParams.get('image') || '',
  }), [searchParams]);

  const charCount = reason.length;
  const canSubmit = Boolean(target.memberId) && reason.trim().length > 0 && !submitting;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!target.memberId) {
      setErrorMessage('신고 대상 회원 정보가 없습니다. memberId와 함께 진입해주세요.');
      return;
    }

    if (!reason.trim()) {
      setErrorMessage('신고 사유를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await createMemberReport({
        reportedMemberId: target.memberId,
        reportType,
        reason: reason.trim(),
      });

      setSuccessMessage('신고가 정상적으로 접수되었습니다. 관리자가 검토 후 처리할 예정입니다.');
      setReason('');
      setReportType('SPAM');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('신고를 제출하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">
              Member Report
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              신고하기
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              건전한 커뮤니티를 위해 신중하게 작성해주세요. 허위 신고는 제재 사유가 될 수 있습니다.
            </p>
          </div>
          <Button variant="ghost" className="shrink-0" onClick={() => navigate(-1)}>
            이전으로
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="border border-gray-200 bg-blue-50 p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-500">
              신고 대상
            </p>
            <div className="mt-5 flex items-center gap-4 bg-white/80 p-4 ring-1 ring-gray-200 backdrop-blur">
              {target.image ? (
                <img
                  src={target.image}
                  alt={target.nickname}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-200"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-extrabold text-white ring-2 ring-blue-200">
                  {getInitials(target.nickname)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-xl font-extrabold tracking-tight text-gray-900">
                    {target.nickname}
                  </h2>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-700">
                    신고 대상
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-medium text-gray-500">
                  {target.username || '닉네임 정보만 제공됨'}
                </p>
                <div className="mt-3 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-100">
                  memberId: {target.memberId || '없음'}
                </div>
              </div>
            </div>

            <div className="mt-6 bg-white/80 p-5 ring-1 ring-gray-200">
              <p className="text-sm font-bold text-gray-900">신고 전에 확인해주세요</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
                <li>구체적인 정황을 작성할수록 관리자가 더 정확하게 검토할 수 있습니다.</li>
                <li>거짓 신고나 감정적인 신고는 제재 대상이 될 수 있습니다.</li>
                <li>제출된 신고는 수정할 수 없으니 내용을 다시 확인해주세요.</li>
              </ul>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-bold text-gray-900">
                  신고 유형 선택
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {reportTypeOptions.map((option) => {
                    const selected = option.value === reportType;

                    return (
                      <label
                        key={option.value}
                        className={[
                          'cursor-pointer border p-4 transition',
                          selected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/40',
                        ].join(' ')}
                      >
                        <input
                          type="radio"
                          name="reportType"
                          value={option.value}
                          checked={selected}
                          onChange={(event) => setReportType(event.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-gray-900">{option.label}</p>
                            <p className="mt-2 text-xs leading-5 text-gray-500">{option.description}</p>
                          </div>
                          <span
                            className={[
                              'mt-0.5 h-5 w-5 rounded-full border-2',
                              selected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white',
                            ].join(' ')}
                          />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label htmlFor="report-reason" className="block text-sm font-bold text-gray-900">
                    신고 사유 작성
                  </label>
                  <span className="text-xs font-semibold text-gray-400">{charCount} / 1000</span>
                </div>
                <div className="overflow-hidden border border-gray-200 bg-blue-50 shadow-inner focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-200">
                  <textarea
                    id="report-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value.slice(0, 1000))}
                    placeholder="신고 사유를 상세히 적어주세요. 거래 정황, 반복 여부, 확인한 문제를 구체적으로 적어주시면 검토에 도움이 됩니다."
                    className="min-h-[220px] w-full resize-none border-none bg-transparent px-5 py-4 text-sm leading-6 text-gray-800 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {errorMessage ? (
                <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              <div className="bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-600 ring-1 ring-gray-100">
                신고 내용은 관리자 검토 후 처리됩니다. 반복적인 위반이 확인되면 로그인, 거래, 채팅 기능 제한으로 이어질 수 있습니다.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  to="/me"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-gray-100 px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
                >
                  마이페이지로
                </Link>
                <Button type="submit" size="lg" className="sm:min-w-44" disabled={!canSubmit}>
                  {submitting ? '제출 중...' : '신고 제출하기'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
