import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../features/auth/useAuth";

export default function RequireAdmin() {
  const location = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const redirectPath = `${location.pathname}${location.search}${location.hash}`;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 py-16 text-sm font-medium text-slate-500">
        {"\uAD00\uB9AC\uC790 \uAD8C\uD55C\uC744 \uD655\uC778\uD558\uB294 \uC911\uC785\uB2C8\uB2E4..."}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
        replace
      />
    );
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
