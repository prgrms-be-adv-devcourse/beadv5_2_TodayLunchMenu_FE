import { Link } from 'react-router-dom';

import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import { useAuth } from '../../features/auth/useAuth';

const DEFAULT_DEPOSIT_BALANCE = 0;
const DEFAULT_ACTIVE_ORDERS = 0;
const DEFAULT_COUPONS = 0;
const DEFAULT_ADDRESS_COUNT = 0;

function formatPrice(value) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatJoinedAt(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function MyPage() {
  const { user } = useAuth();
  const isSeller = user?.role === 'SELLER';

  const me = {
    name: user?.nickname ?? '게스트',
    email: user?.email ?? '',
    joinedAt: formatJoinedAt(user?.createdAt),
    depositBalance: DEFAULT_DEPOSIT_BALANCE,
    activeOrders: DEFAULT_ACTIVE_ORDERS,
    coupons: DEFAULT_COUPONS,
    addressCount: DEFAULT_ADDRESS_COUNT,
    profileImageUrl: user?.profileImageUrl ?? '',
  };

  const quickLinks = [
    {
      title: '주문 내역',
      description: `${me.activeOrders}건 진행 중`,
      to: '/orders',
      icon: '📦',
    },
    {
      title: '예치금',
      description: `${formatPrice(me.depositBalance)}원 보유`,
      to: '/deposits',
      icon: '💳',
    },
    {
      title: '출금',
      description: '예치금을 계좌로 출금',
      to: '/withdrawals',
      icon: '↗',
    },
    {
      title: '내 신고 이력',
      description: '제출한 신고와 처리 현황 확인',
      to: '/member-reports/me',
      icon: '🗂️',
    },
    {
      title: '알림',
      description: '주문, 결제, 정산 알림 보기',
      to: '/notifications',
      icon: '🔔',
    },
    {
      title: '외부 계정',
      description: '카카오 등 로그인 연동 관리',
      to: '/me/external-accounts',
      icon: '🔗',
    },
  ];

  return (
    <PageContainer>
      <section className="mt-4 flex flex-col items-center text-center">
        <div className="relative">
          {me.profileImageUrl ? (
            <img
              src={me.profileImageUrl}
              alt="내 프로필 이미지"
              className="h-28 w-28 rounded-full border-4 border-blue-500 object-cover shadow-2xl"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-blue-500 bg-white shadow-2xl">
              <span className="text-4xl font-extrabold text-blue-700">
                {me.name.slice(0, 1) || 'G'}
              </span>
            </div>
          )}
          {isSeller ? (
            <div className="absolute bottom-0 right-0 rounded-full border-4 border-blue-50 bg-blue-700 px-3 py-2 text-xs font-bold text-white shadow-lg">
              SELLER
            </div>
          ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">{me.name}</h1>
        <p className="text-sm font-medium text-gray-500">{me.email}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
          Member since {me.joinedAt}
        </p>
      </section>

      <section className="relative mt-8 overflow-hidden bg-gray-100 p-6">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/10" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-700">
              Account Type
            </span>
            <h2 className="text-xl font-bold text-gray-900">{isSeller ? '판매자 회원' : '일반 회원'}</h2>
          </div>
          <span className="text-sm font-bold text-blue-700">{formatPrice(me.depositBalance)}원</span>
        </div>

        {isSeller ? (
          <div className="mt-4 bg-white/70 p-4 text-sm text-gray-700 ring-1 ring-gray-200">
            판매자 계정이 활성화되어 있습니다. 판매자 센터에서 상품, 주문, 정산 기능을 이용할 수 있습니다.
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/me/edit">
            <Button>내 정보 수정</Button>
          </Link>
          <Link to="/orders">
            <Button variant="secondary">주문 내역</Button>
          </Link>
          <Link to="/deposits">
            <Button variant="secondary">예치금 보기</Button>
          </Link>
          <Link to="/withdrawals">
            <Button variant="secondary">출금하기</Button>
          </Link>
          <Link to="/member-reports/me">
            <Button variant="secondary">내 신고 이력</Button>
          </Link>
          {isSeller ? (
            <Link to="/seller/products">
              <Button>판매자 센터</Button>
            </Link>
          ) : (
            <Link to="/seller/register">
              <Button>판매자 등록</Button>
            </Link>
          )}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-2 gap-4">
        {quickLinks.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="bg-white p-4 shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
          >
            <div className="mb-2 text-2xl">{item.icon}</div>
            <span className="block text-sm font-bold text-gray-900">{item.title}</span>
            <span className="text-[11px] font-medium text-gray-500">{item.description}</span>
          </Link>
        ))}
      </section>

      <section className="mt-8 bg-blue-50 p-2">
        <Link
          to="/me/settings"
          className="flex items-center gap-4 p-4 transition hover:bg-white/60"
        >
          <span>⚙️</span>
          <span className="flex-1 text-sm font-semibold">설정</span>
          <span className="text-gray-400">›</span>
        </Link>

        <Link
          to="/me/privacy"
          className="flex items-center gap-4 p-4 transition hover:bg-white/60"
        >
          <span>🔒</span>
          <span className="flex-1 text-sm font-semibold">개인정보 / 보안</span>
          <span className="text-gray-400">›</span>
        </Link>

        <Link
          to="/me/external-accounts"
          className="flex items-center gap-4 p-4 transition hover:bg-white/60"
        >
          <span>🔗</span>
          <span className="flex-1 text-sm font-semibold">외부 계정 연동</span>
          <span className="text-gray-400">›</span>
        </Link>
      </section>
    </PageContainer>
  );
}
