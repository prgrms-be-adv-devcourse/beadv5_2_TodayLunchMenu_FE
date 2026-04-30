import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

const SECTIONS = [
  {
    id: "reports",
    title: "신고 관리",
    description: "회원 신고 목록을 확인하고 처리 상태를 관리합니다.",
    to: "/admin/member-reports",
    cta: "신고 목록 보기",
    accent: "border-l-red-500",
    badge: "bg-red-100 text-red-700",
    badgeLabel: "신고",
  },
  {
    id: "sanctions",
    title: "제재 이력",
    description: "회원 이용 제한 및 제재 처리 이력을 조회합니다.",
    to: "/admin/member-restrictions",
    cta: "제재 이력 보기",
    accent: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-700",
    badgeLabel: "제재",
  },
  {
    id: "categories",
    title: "카테고리 관리",
    description: "상품 카테고리 계층 구조를 추가·수정·삭제합니다.",
    to: "/admin/categories",
    cta: "카테고리 편집",
    accent: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-700",
    badgeLabel: "카테고리",
  },
  {
    id: "settlements",
    title: "정산 운영",
    description: "판매자 정산 내역을 조회하고 운영 처리를 진행합니다.",
    to: "/admin/settlements/ops",
    cta: "정산 현황 보기",
    accent: "border-l-green-500",
    badge: "bg-green-100 text-green-700",
    badgeLabel: "정산",
  },
  {
    id: "embeddings",
    title: "임베딩 관리",
    description: "상품 벡터 임베딩 재인덱싱 및 AI 검색 데이터를 관리합니다.",
    to: "/admin/embeddings",
    cta: "임베딩 관리",
    accent: "border-l-violet-500",
    badge: "bg-violet-100 text-violet-700",
    badgeLabel: "AI",
  },
];

const QUICK_LINKS = [
  { label: "신고 대기 목록", to: "/admin/member-reports" },
  { label: "카테고리 추가", to: "/admin/categories" },
  { label: "정산 처리", to: "/admin/settlements/ops" },
  { label: "제재 회원 확인", to: "/admin/member-restrictions" },
  { label: "임베딩 재인덱싱", to: "/admin/embeddings" },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="space-y-8">
      {/* 환영 배너 */}
      <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white shadow-sm">
        <p className="text-sm font-medium text-blue-200">{today}</p>
        <h1 className="mt-1 text-2xl font-bold">
          안녕하세요, {user?.nickname || "관리자"}님
        </h1>
        <p className="mt-1 text-sm text-blue-200">
          GoodsMall 관리자 센터에 오신 것을 환영합니다.
        </p>
      </div>

      {/* 빠른 이동 */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            빠른 이동
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100 hover:border-blue-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 관리 섹션 카드 */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">관리 메뉴</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((section) => (
            <div
              key={section.id}
              className={`flex flex-col rounded-lg border border-gray-200 border-l-4 bg-white shadow-sm transition hover:shadow-md ${section.accent}`}
            >
              <div className="flex items-start justify-between p-5">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${section.badge}`}
                    >
                      {section.badgeLabel}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">
                    {section.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto border-t border-gray-100 px-5 py-3">
                <Link
                  to={section.to}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {section.cta} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
