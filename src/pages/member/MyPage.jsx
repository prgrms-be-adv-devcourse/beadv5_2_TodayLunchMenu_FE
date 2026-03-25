import { Link } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";

const MOCK_ME = {
  id: 1,
  name: "희원",
  email: "user@example.com",
  role: "USER",
  isSeller: true,
  joinedAt: "2023.09",
  depositBalance: 42000,
  activeOrders: 3,
  coupons: 2,
  addressCount: 1,
};

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function MyPage() {
  const me = MOCK_ME;

  const quickLinks = [
    {
      title: "주문 내역",
      description: `${me.activeOrders}건 진행 중`,
      to: "/orders",
      icon: "📦",
    },
    {
      title: "예치금",
      description: `${formatPrice(me.depositBalance)}원 보유`,
      to: "/deposits",
      icon: "💳",
    },
    {
      title: "주소 관리",
      description: `${me.addressCount}개 등록`,
      to: "/me/addresses",
      icon: "📍",
    },
    {
      title: "쿠폰",
      description: `${me.coupons}개 사용 가능`,
      to: "/me/coupons",
      icon: "🎟️",
    },
  ];

  return (
    <PageContainer>
      <section className="mt-4 flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-violet-600 bg-white shadow-2xl shadow-violet-500/10">
            <span className="text-4xl font-extrabold text-violet-700">
              {me.name.slice(0, 1)}
            </span>
          </div>
          {me.isSeller ? (
            <div className="absolute bottom-0 right-0 rounded-full border-4 border-[#fdf3ff] bg-gradient-to-br from-violet-700 to-violet-600 p-2 text-white shadow-lg">
              ✦
            </div>
          ) : null}
        </div>

        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">
          {me.name}
        </h1>
        <p className="text-sm font-medium text-gray-500">{me.email}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-violet-600">
          Member since {me.joinedAt}
        </p>
      </section>

      <section className="relative mt-8 overflow-hidden rounded-[28px] bg-purple-100/70 p-6">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-400/10" />
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-700">
              Account Type
            </span>
            <h2 className="text-xl font-bold text-gray-900">
              {me.isSeller ? "판매자 회원" : "일반 회원"}
            </h2>
          </div>
          <span className="text-sm font-bold text-violet-700">
            {formatPrice(me.depositBalance)}원
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/orders">
            <Button variant="secondary">주문 내역</Button>
          </Link>
          <Link to="/deposits">
            <Button variant="secondary">예치금 보기</Button>
          </Link>
          {me.isSeller ? (
            <Link to="/seller/products">
              <Button>판매자센터</Button>
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
            <span className="block text-sm font-bold text-gray-900">
              {item.title}
            </span>
            <span className="text-[11px] font-medium text-gray-500">
              {item.description}
            </span>
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

        <button
          type="button"
          className="flex w-full items-center gap-4 rounded-2xl p-4 text-red-600 transition hover:bg-white/60"
        >
          <span>↩</span>
          <span className="flex-1 text-left text-sm font-semibold">
            로그아웃
          </span>
        </button>
      </section>
    </PageContainer>
  );
}