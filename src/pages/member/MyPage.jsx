import { Link } from 'react-router-dom';

import Button from '../../components/common/Button';
import PageContainer from '../../components/common/PageContainer';
import { useAuth } from '../../features/auth/useAuth';
import { useSeller } from '../../features/seller/useSeller';

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
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isSeller = user?.role === 'SELLER';
  const { seller, loading: sellerLoading, error: sellerError } = useSeller(
    isAuthenticated && !authLoading && isSeller
  );

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
      title: '쿠폰',
      description: `${me.coupons}개 사용 가능`,
      to: '/me/coupons',
      icon: '🎟️',
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
              className="h-28 w-28 rounded-full border-4 border-violet-600 object-cover shadow-2xl shadow-violet-500/10"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-violet-600 bg-white shadow-2xl shadow-violet-500/10">
              <span className="text-4xl font-extrabold text-violet-700">
                {me.name.slice(0, 1) || 'G'}
              </span>
            </div>
          )}
          {isSeller ? (
            <div className="absolute bottom-0 right-0 rounded-full border-4 border-[#fdf3ff] bg-gradient-to-br from-violet-700 to-violet-600 px-3 py-2 text-xs font-bold text-white shadow-lg">
              SELLER
            </div>
          ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">{me.name}</h1>
        <p className="text-sm font-medium text-gray-500">{me.email}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-violet-600">
          Member since {me.joinedAt}
        </p>
      </section>

      <section className="relative mt-8 overflow-hidden rounded-[28px] bg-purple-100/70 p-6">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-400/10" />
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-700">
              Account Type
            </span>
            <h2 className="text-xl font-bold text-gray-900">{isSeller ? '판매자 회원' : '일반 회원'}</h2>
          </div>
          <span className="text-sm font-bold text-violet-700">{formatPrice(me.depositBalance)}원</span>
        </div>

        {sellerLoading ? <p className="mt-4 text-sm text-gray-500">판매자 정보를 확인하고 있습니다.</p> : null}

        {!sellerLoading && sellerError ? (
          <p className="mt-4 text-sm text-red-600">판매자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
        ) : null}

        {isSeller && seller ? (
          <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-gray-700 ring-1 ring-purple-100">
            <p>등록 은행: {seller.bankName || '-'}</p>
            <p>정산 계좌: {seller.account || '-'}</p>
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
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100 transition hover:shadow-md"
          >
            <div className="mb-2 text-2xl">{item.icon}</div>
            <span className="block text-sm font-bold text-gray-900">{item.title}</span>
            <span className="text-[11px] font-medium text-gray-500">{item.description}</span>
          </Link>
        ))}
      </section>

      <section className="mt-8 rounded-[28px] bg-purple-50/70 p-2">
        <Link
          to="/me/settings"
          className="flex items-center gap-4 rounded-2xl p-4 transition hover:bg-white/60"
        >
          <span>⚙️</span>
          <span className="flex-1 text-sm font-semibold">설정</span>
          <span className="text-gray-400">›</span>
        </Link>

        <Link
          to="/me/privacy"
          className="flex items-center gap-4 rounded-2xl p-4 transition hover:bg-white/60"
        >
          <span>🔒</span>
          <span className="flex-1 text-sm font-semibold">개인정보 / 보안</span>
          <span className="text-gray-400">›</span>
        </Link>
      </section>
    </PageContainer>
  );
}
