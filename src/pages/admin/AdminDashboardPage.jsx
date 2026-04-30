import { Link } from "react-router-dom";

const MENU_ITEMS = [
  {
    id: "reports",
    title: "신고 관리",
    description: "전체 회원 신고 목록 조회 및 처리 상태 관리",
    to: "/admin/member-reports",
    color: "bg-rose-50 border-rose-200 hover:border-rose-400",
    iconBg: "bg-rose-100 text-rose-600",
    icon: "R",
  },
  {
    id: "sanctions",
    title: "제재 이력",
    description: "회원 제재 및 이용 제한 이력 조회",
    to: "/admin/member-restrictions",
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    iconBg: "bg-orange-100 text-orange-600",
    icon: "S",
  },
  {
    id: "categories",
    title: "카테고리 관리",
    description: "상품 카테고리 추가·수정·삭제 및 계층 구조 관리",
    to: "/admin/categories",
    color: "bg-violet-50 border-violet-200 hover:border-violet-400",
    iconBg: "bg-violet-100 text-violet-600",
    icon: "C",
  },
  {
    id: "settlements",
    title: "정산 운영",
    description: "판매자 정산 내역 조회 및 운영 처리",
    to: "/admin/settlements/ops",
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    iconBg: "bg-emerald-100 text-emerald-600",
    icon: "W",
  },
  {
    id: "embeddings",
    title: "임베딩 관리",
    description: "상품 벡터 임베딩 재인덱싱 및 AI 검색 데이터 관리",
    to: "/admin/embeddings",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-100 text-blue-600",
    icon: "E",
  },
];

export default function AdminDashboardPage() {
  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
          관리자 대시보드
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          운영에 필요한 관리 기능을 한눈에 확인하고 이동할 수 있습니다.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={`flex flex-col gap-4 rounded-2xl border-2 p-6 transition-all duration-150 hover:shadow-lg ${item.color}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${item.iconBg}`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Admin
                </p>
                <h2 className="text-lg font-bold text-gray-900">{item.title}</h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
            <div className="mt-auto flex items-center gap-1 text-xs font-semibold text-slate-500">
              바로가기 →
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
