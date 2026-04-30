import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

const navItems = [
  { id: "dashboard", label: "홈", to: "/admin" },
  { id: "reports", label: "신고 관리", to: "/admin/member-reports" },
  { id: "sanctions", label: "제재 이력", to: "/admin/member-restrictions" },
  { id: "categories", label: "카테고리", to: "/admin/categories" },
  { id: "settlements", label: "정산 운영", to: "/admin/settlements/ops" },
  { id: "embeddings", label: "임베딩", to: "/admin/embeddings" },
];

export default function AdminNav() {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-blue-800 bg-blue-700 shadow-md">
      <div className="flex h-14 items-center justify-between px-6">
        {/* 로고 */}
        <div className="flex items-center gap-8">
          <Link
            to="/admin"
            className="flex items-center gap-2 text-lg font-black tracking-tight text-white"
          >
            <span className="rounded bg-white px-1.5 py-0.5 text-xs font-black text-blue-700">
              ADMIN
            </span>
            GoodsMall
          </Link>

          {/* 상단 네비 링크 */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  [
                    "rounded px-3 py-1.5 text-sm font-medium transition",
                    isActive
                      ? "bg-blue-900 text-white"
                      : "text-blue-100 hover:bg-blue-600 hover:text-white",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* 우측 사용자 정보 */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-blue-200 hover:text-white hover:underline"
          >
            일반 사이트
          </Link>
          <div className="h-4 w-px bg-blue-500" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {user?.nickname?.slice(0, 1) || "A"}
            </div>
            <span className="text-sm font-medium text-blue-100">
              {user?.nickname || "관리자"}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
