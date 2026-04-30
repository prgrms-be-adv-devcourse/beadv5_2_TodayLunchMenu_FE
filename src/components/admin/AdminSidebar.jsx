import { NavLink } from "react-router-dom";

const sidebarItems = [
  {
    id: "dashboard",
    label: "대시보드",
    to: "/admin",
    end: true,
  },
  {
    id: "reports",
    label: "신고 관리",
    to: "/admin/member-reports",
  },
  {
    id: "sanctions",
    label: "제재 이력",
    to: "/admin/member-restrictions",
  },
  {
    id: "categories",
    label: "카테고리 관리",
    to: "/admin/categories",
  },
  {
    id: "settlements",
    label: "정산 운영",
    to: "/admin/settlements/ops",
  },
  {
    id: "embeddings",
    label: "임베딩 관리",
    to: "/admin/embeddings",
  },
];

export default function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="px-4 py-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          관리 메뉴
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-600 rounded-l-none"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <p className="text-[11px] text-gray-400">GoodsMall Admin v1.0</p>
      </div>
    </aside>
  );
}
