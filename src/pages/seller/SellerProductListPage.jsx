import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import ConfirmModal from "../../components/common/ConfirmModal";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { useAuth } from "../../features/auth/useAuth";
import { getSellerProductsApi } from "../../features/product/productApi";

const FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "ACTIVE", label: "판매중" },
  { value: "SOLD_OUT", label: "품절" },
  { value: "INACTIVE", label: "비공개" },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function StatusBadge({ status }) {
  const meta = {
    ACTIVE: { label: "판매중", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    SOLD_OUT: { label: "품절", className: "bg-red-50 text-red-600 border border-red-200" },
    INACTIVE: { label: "비공개", className: "bg-gray-100 text-gray-500 border border-gray-200" },
  }[status] ?? { label: status, className: "bg-gray-100 text-gray-500 border border-gray-200" };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export default function SellerProductListPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isSeller = user?.role === "SELLER";

  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSeller) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const { items } = await getSellerProductsApi({ page: 0, size: 50 });
        if (!cancelled) setProducts(items);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof ApiError ? err.message : "상품 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isSeller]);

  const filteredProducts = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    return products.filter((p) => {
      const matchFilter = filter === "ALL" || p.status === filter;
      const matchKeyword = !trimmed || (p.name || "").toLowerCase().includes(trimmed);
      return matchFilter && matchKeyword;
    });
  }, [products, keyword, filter]);

  if (authLoading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-gray-400">권한을 확인하는 중...</p>
      </PageContainer>
    );
  }

  if (!isSeller) return <Navigate to="/seller/register" replace />;

  const activeCount = products.filter((p) => p.status === "ACTIVE").length;
  const soldOutCount = products.filter((p) => p.status === "SOLD_OUT").length;
  const inactiveCount = products.filter((p) => p.status === "INACTIVE").length;

  const handleDelete = () => {
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <>
      <PageContainer>
        {/* 헤더 */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Seller Hub</p>
            <h1 className="mt-0.5 text-xl font-extrabold text-gray-900">상품 관리</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/seller/products/new")}
            className="flex items-center gap-1.5 rounded-full bg-violet-700 px-4 py-2 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-800 active:scale-[0.97]"
          >
            <span className="text-base leading-none">+</span>
            상품 등록
          </button>
        </div>

        {/* 통계 요약 */}
        {!loading && products.length > 0 && (
          <div className="mb-5 grid grid-cols-4 divide-x divide-gray-100 rounded-2xl bg-white py-3 shadow-sm ring-1 ring-gray-100">
            {[
              { label: "전체", value: products.length, color: "text-gray-900" },
              { label: "판매중", value: activeCount, color: "text-emerald-600" },
              { label: "품절", value: soldOutCount, color: "text-red-500" },
              { label: "비공개", value: inactiveCount, color: "text-gray-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 px-2">
                <span className={`text-lg font-extrabold ${color}`}>{value}</span>
                <span className="text-[10px] text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* 검색 */}
        <div className="mb-3">
          <Input
            placeholder="상품명으로 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        {/* 상태 필터 */}
        <div className="-mx-6 mb-5 overflow-x-auto">
          <div className="flex gap-1.5 px-6">
            {FILTERS.map(({ value, label }) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={[
                    "flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition",
                    active
                      ? "bg-violet-700 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* 상품 목록 */}
        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">상품을 불러오는 중...</p>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">
              {products.length === 0 ? "등록된 상품이 없습니다." : "조건에 맞는 상품이 없습니다."}
            </p>
            {products.length === 0 && (
              <button
                type="button"
                onClick={() => navigate("/seller/products/new")}
                className="mt-4 text-sm font-semibold text-violet-600 underline underline-offset-2"
              >
                첫 상품 등록하기
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredProducts.map((product) => (
              <li key={product.id}>
                <article
                  className="flex cursor-pointer gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100 transition hover:ring-violet-200"
                  onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                >
                  {/* 썸네일 */}
                  <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black text-gray-300">
                        {(product.name || "P").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-bold text-gray-900 leading-snug">
                        {product.name}
                      </p>
                      <StatusBadge status={product.status} />
                    </div>

                    <p className="mt-0.5 truncate text-xs text-gray-400">{product.category}</p>

                    <p className="mt-1 text-sm font-extrabold text-violet-700">
                      {formatPrice(product.price)}원
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        재고{" "}
                        <span
                          className={
                            product.stockCount === 0
                              ? "font-bold text-red-500"
                              : "font-semibold text-gray-700"
                          }
                        >
                          {product.stockCount}개
                        </span>
                      </p>

                      <button
                        type="button"
                        className="text-xs text-gray-400 transition hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(product);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="상품을 삭제할까요?"
        description={deleteTarget ? `"${deleteTarget.name}"을(를) 삭제합니다.` : ""}
        confirmText="삭제"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}
