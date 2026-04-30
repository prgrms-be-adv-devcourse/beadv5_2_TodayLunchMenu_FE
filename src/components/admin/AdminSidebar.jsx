import { Link } from "react-router-dom";

function AdminSidebar({ currentPage = "dashboard" }) {
  const isActive = (page) => currentPage === page;

  const sidebarItems = [
    { id: "dashboard", label: "개요", icon: "O", to: "/admin" },
    { id: "reports", label: "전체 신고", icon: "R", to: "/admin/member-reports" },
    { id: "sanctions", label: "제재 이력", icon: "S", to: "/admin/member-restrictions" },
    { id: "categories", label: "카테고리", icon: "C", to: "/admin/categories" },
    { id: "settlements", label: "정산 운영", icon: "W", to: "/admin/settlements/ops" },
    { id: "embeddings", label: "임베딩", icon: "E", to: "/admin/embeddings" },
  ];

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-violet-100 bg-[#f3e2ff] p-4 pt-20 lg:flex lg:flex-col">
      <div className="mb-6 px-4 py-6">
        <h2 className="text-lg font-bold text-violet-700">관리자 패널</h2>
        <p className="text-xs text-slate-500">운영 관리</p>
      </div>

      <nav className="flex-1 space-y-1">
        {sidebarItems.map((item) => {
          const isCurrentActive = isActive(item.id);
          const className = `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
            isCurrentActive
              ? "bg-violet-100 text-violet-700"
              : "text-slate-600 hover:translate-x-1 hover:bg-white/70"
          }`;

          return (
            <Link key={item.id} to={item.to} className={className}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Link
        to="/member-reports/new"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.02]"
      >
        + 빠른 신고
      </Link>
    </aside>
  );
}

export default AdminSidebar;
