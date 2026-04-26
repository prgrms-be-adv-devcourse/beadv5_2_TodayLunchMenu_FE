import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../features/auth/useAuth";
import { clearCartState, useCart } from "../../features/cart/useCart";
import { useNotification } from "../../features/notification/useNotification";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-gray-900 text-white"
      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  ].join(" ");

function NotificationBadge({ count }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function UserMenu({ displayName, isSeller, onLogout }) {
  return (
    <div className="group relative hidden sm:block">
      <button
        type="button"
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        {displayName}님
      </button>

      <div className="invisible absolute right-0 top-full z-50 w-44 -translate-y-1 rounded-2xl border border-gray-200 bg-white p-2 opacity-0 shadow-xl transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <Link
          to="/me"
          className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
        >
          마이페이지
        </Link>
        <Link
          to="/orders"
          className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
        >
          주문내역
        </Link>
        <Link
          to="/deposits"
          className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
        >
          예치금
        </Link>
        <Link
          to="/withdrawals"
          className="block rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
        >
          출금
        </Link>
        {isSeller ? (
          <>
            <Link
              to="/seller/products"
              className="block rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
            >
              판매자 메뉴
            </Link>
            <Link
              to="/seller/settlements"
              className="block rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
            >
              정산 관리
            </Link>
          </>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          className="block w-full rounded-xl px-3 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotification();
  const { cartCount } = useCart();
  const isLoggedIn = isAuthenticated && Boolean(user);
  const isAdmin = user?.role === "ADMIN";
  const isSeller = user?.role === "SELLER";
  const displayName = user?.nickname || "회원";
  const cartLoginPath = "/login?redirect=%2Fcart";

  useEffect(() => {
    if (!isLoggedIn) {
      clearCartState();
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // useAuth.logout clears auth state even if the API call fails.
    } finally {
      clearCartState();
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
            GoodsMall
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/products" className={navLinkClass}>
              상품
            </NavLink>
            <NavLink to="/auctions" className={navLinkClass}>
              경매장
            </NavLink>
            {isAdmin && <NavLink to="/admin/categories" className={navLinkClass}>카테고리 관리</NavLink>}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={isLoggedIn ? "/cart" : cartLoginPath}
            className="relative rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            장바구니
            {cartCount > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link
              to="/notifications"
              className="relative rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <span className="inline-flex items-center">
                알림
                <NotificationBadge count={unreadCount} />
              </span>
            </Link>
          ) : null}

          {isLoggedIn ? (
            <>
              <UserMenu displayName={displayName} isSeller={isSeller} onLogout={handleLogout} />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

