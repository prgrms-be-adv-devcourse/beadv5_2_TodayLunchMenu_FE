import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";

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

export default function AppHeader() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { unreadCount } = useNotification();
  const { cartCount } = useCart();
  const isLoggedIn = isAuthenticated && Boolean(user);
  const isAdmin = user?.role === "ADMIN";
  const displayName = user?.nickname || "회원";

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
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
            ZeroMarket
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/products" className={navLinkClass}>
              상품
            </NavLink>
            <NavLink to="/auctions" className={navLinkClass}>
              경매장
            </NavLink>
            <NavLink to="/cart" className={navLinkClass}>
              장바구니
            </NavLink>
            <NavLink to="/orders" className={navLinkClass}>
              주문내역
            </NavLink>
            <NavLink to="/deposits" className={navLinkClass}>
              예치금
            </NavLink>
            <NavLink to="/withdrawals" className={navLinkClass}>
              출금
            </NavLink>
            {isAdmin && (
              <NavLink to="/seller/products" className={navLinkClass}>
                판매자 메뉴
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            장바구니
            {cartCount > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to="/notifications"
            className="relative rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="inline-flex items-center">
              알림
              {isLoggedIn ? <NotificationBadge count={unreadCount} /> : null}
            </span>
          </Link>

          {isLoggedIn ? (
            <>
              <span className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-700 sm:inline-block">
                {displayName}님
              </span>
              <Link
                to="/me"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                마이페이지
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : "로그아웃"}
              </button>
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

