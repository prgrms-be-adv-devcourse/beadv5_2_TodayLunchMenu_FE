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
    <aside className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-56 flex-col border-r border-sand bg-white lg:flex">
      <div className="px-4 py-5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-silver">
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
                  ? "bg-fog text-plum font-semibold border-l-2 border-brand rounded-l-none"
                  : "text-plum hover:bg-fog hover:text-plum",
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sand p-4">
        <p className="text-[11px] text-silver">GoodsMall Admin v1.0</p>
      </div>
    </aside>
  );
}
