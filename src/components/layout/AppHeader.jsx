import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAccessTokenRemaining } from "../../features/auth/useAccessTokenRemaining";
import { useAuth } from "../../features/auth/useAuth";
import { clearCartState, useCart } from "../../features/cart/useCart";
import { useNotification } from "../../features/notification/useNotification";

const navLinkClass = ({ isActive }) =>
  [
    "rounded-pin px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-sand text-plum"
      : "text-olive hover:bg-fog hover:text-plum",
  ].join(" ");

function NotificationBadge({ count }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function UserMenu({ displayName, isAdmin, isSeller, onLogout }) {
  return (
    <div className="group relative hidden sm:block">
      <button
        type="button"
        className="rounded-pin px-3 py-2 text-sm font-medium text-olive transition-colors hover:bg-fog hover:text-plum"
      >
        {displayName}님
      </button>

      <div className="invisible absolute right-0 top-full z-50 w-44 -translate-y-1 rounded-card border border-sand bg-white p-2 shadow-lg transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 opacity-0">
        {isAdmin ? (
          <Link
            to="/admin"
            className="block rounded-pin px-3 py-2 text-sm font-medium text-olive transition hover:bg-fog hover:text-plum"
          >
            관리자 페이지
          </Link>
        ) : (
          <Link
            to="/me"
            className="block rounded-pin px-3 py-2 text-sm font-medium text-olive transition hover:bg-fog hover:text-plum"
          >
            마이페이지
          </Link>
        )}
        <Link
          to="/orders"
          className="block rounded-pin px-3 py-2 text-sm font-medium text-olive transition hover:bg-fog hover:text-plum"
        >
          주문내역
        </Link>
        <Link
          to="/deposits"
          className="block rounded-pin px-3 py-2 text-sm font-medium text-olive transition hover:bg-fog hover:text-plum"
        >
          예치금
        </Link>
        <Link
          to="/withdrawals"
          className="block rounded-pin px-3 py-2 text-sm font-medium text-olive transition hover:bg-fog hover:text-plum"
        >
          출금
        </Link>
        {isSeller ? (
          <Link
            to="/seller/me"
            className="block rounded-pin px-3 py-2 text-sm font-medium text-olive transition hover:bg-fog hover:text-plum"
          >
            판매자 메뉴
          </Link>
        ) : null}
        <button
          type="button"
          onClick={onLogout}
          className="block w-full rounded-pin px-3 py-2 text-center text-sm font-medium text-olive transition hover:bg-fog hover:text-plum"
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
  const { formattedRemaining, isExpiringSoon } =
    useAccessTokenRemaining(isAuthenticated);
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
    <header className="sticky top-0 z-50 border-b border-sand bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-plum"
          >
            GoodsMall
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/products" className={navLinkClass}>
              상품
            </NavLink>
            <NavLink to="/auctions" className={navLinkClass}>
              경매장
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/categories" className={navLinkClass}>
                카테고리 관리
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <div
              className={[
                "hidden rounded-full px-3 py-1 text-xs font-semibold sm:block",
                isExpiringSoon
                  ? "bg-amber-100 text-amber-700"
                  : "bg-fog text-olive",
              ].join(" ")}
            >
              세션 {formattedRemaining}
            </div>
          ) : null}

          <Link
            to={isLoggedIn ? "/cart" : cartLoginPath}
            className="relative rounded-pin px-3 py-2 text-sm font-medium text-olive transition-colors hover:bg-fog hover:text-plum"
          >
            장바구니
            {cartCount > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-xs font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <Link
              to="/notifications"
              className="relative rounded-pin px-3 py-2 text-sm font-medium text-olive transition-colors hover:bg-fog hover:text-plum"
            >
              <span className="inline-flex items-center">
                알림
                <NotificationBadge count={unreadCount} />
              </span>
            </Link>
          ) : null}

          {isLoggedIn ? (
            <UserMenu
              displayName={displayName}
              isAdmin={isAdmin}
              isSeller={isSeller}
              onLogout={handleLogout}
            />
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-pin px-3 py-2 text-sm font-medium text-olive transition-colors hover:bg-fog hover:text-plum"
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="rounded-pin bg-brand px-3 py-2 text-sm font-medium text-black transition hover:bg-brand-hover"
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
