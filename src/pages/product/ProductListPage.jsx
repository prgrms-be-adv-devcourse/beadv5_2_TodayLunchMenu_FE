import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import ProductCard from "../../components/product/ProductCard";
import { useCart } from "../../features/cart/useCart";
import { useCartToast } from "../../features/cart/useCartToast";
import { useCategories, useProducts } from "../../features/product/useProducts";

const STATUS_OPTIONS = ["전체", "판매중"];
const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "priceAsc", label: "가격 낮은순" },
  { value: "priceDesc", label: "가격 높은순" },
  { value: "name", label: "이름순" },
];
const SORT_MAP = {
  latest: "createdAt,desc",
  priceAsc: "price,asc",
  priceDesc: "price,desc",
  name: "createdAt,desc",
};
const PAGE_SIZE = 12;

function CategoryTree({ tree, selectedId, onSelect }) {
  return (
    <nav>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={[
          "w-full px-4 py-2 text-left text-sm transition",
          !selectedId
            ? "bg-blue-50 font-semibold text-blue-700"
            : "text-gray-700 hover:bg-gray-50",
        ].join(" ")}
      >
        전체 상품
      </button>

      {tree.map((root) => (
        <div key={root.id}>
          <button
            type="button"
            onClick={() => onSelect(root.id)}
            className={[
              "w-full px-4 py-2 text-left text-sm font-semibold transition",
              selectedId === root.id
                ? "bg-blue-50 text-blue-700"
                : "text-gray-800 hover:bg-gray-50",
            ].join(" ")}
          >
            {root.name}
          </button>

          {root.children.map((child) => (
            <div key={child.id}>
              <button
                type="button"
                onClick={() => onSelect(child.id)}
                className={[
                  "w-full py-1.5 pl-7 pr-4 text-left text-sm transition",
                  selectedId === child.id
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "text-gray-600 hover:bg-gray-50",
                ].join(" ")}
              >
                {child.name}
              </button>

              {child.children.map((grandchild) => (
                <button
                  key={grandchild.id}
                  type="button"
                  onClick={() => onSelect(grandchild.id)}
                  className={[
                    "w-full py-1 pl-11 pr-4 text-left text-xs transition",
                    selectedId === grandchild.id
                      ? "bg-blue-50 font-semibold text-blue-700"
                      : "text-gray-500 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {grandchild.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}

export default function ProductListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialCategoryId = new URLSearchParams(location.search).get("categoryId");

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sort, setSort] = useState("latest");
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedKeyword, selectedCategoryId, sort, statusFilter]);

  const { addToCart } = useCart({ autoLoad: false });
  const { toast, showToast } = useCartToast();
  const { products, pageInfo, loading, fetching, error } = useProducts({
    page: currentPage,
    size: PAGE_SIZE,
    sort: SORT_MAP[sort],
    keyword: debouncedKeyword || undefined,
    categoryId: selectedCategoryId || undefined,
  });
  const { categories } = useCategories();

  const categoryTree = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    const getChildren = (parentId) => categories.filter((c) => c.parentId === parentId);
    return roots.map((root) => ({
      ...root,
      children: getChildren(root.id).map((child) => ({
        ...child,
        children: getChildren(child.id),
      })),
    }));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.type !== "AUCTION");
    if (statusFilter === "판매중") {
      result = result.filter((p) => p.status !== "SOLD_OUT" && p.stockCount > 0);
    }
    if (sort === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, "ko"));
    }
    return result;
  }, [products, statusFilter, sort]);

  const categoryPath = useMemo(() => {
    if (!selectedCategoryId) return [];
    const path = [];
    let cur = categories.find((c) => c.id === selectedCategoryId);
    while (cur) {
      path.unshift(cur);
      cur = cur.parentId ? categories.find((c) => c.id === cur.parentId) : null;
    }
    return path;
  }, [categories, selectedCategoryId]);

  const totalPages = pageInfo.totalPages;

  const handleReset = () => {
    setKeyword("");
    setStatusFilter("전체");
    setSort("latest");
    setSelectedCategoryId(null);
    setCurrentPage(0);
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      showToast("장바구니에 담았습니다.");
    } catch (nextError) {
      if (nextError?.status === 401) { navigate("/login"); return; }
      showToast(nextError?.message || "장바구니에 담지 못했습니다.", true);
    }
  };

  const hasFilter = keyword || statusFilter !== "전체" || sort !== "latest" || selectedCategoryId;

  return (
    <div className="text-left">
      {/* Page Header */}
      <div className="mb-5">
        <h1 className="text-xl font-black text-gray-900">상품 목록</h1>
        <p className="mt-0.5 text-sm text-gray-500">다양한 상품을 탐색하고 원하는 상품을 찾아보세요</p>
      </div>

      <div className="flex items-start gap-0">
        {/* Category Sidebar */}
        <aside
          className={[
            "shrink-0 transition-all duration-200",
            sidebarOpen ? "w-48" : "w-0 overflow-hidden",
          ].join(" ")}
        >
          <div className="mr-4 overflow-hidden border border-gray-200 bg-white">
            <div className="bg-blue-700 px-4 py-2.5">
              <h2 className="text-sm font-bold text-white">카테고리</h2>
            </div>
            <CategoryTree
              tree={categoryTree}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          {/* Top Bar */}
          <div className="mb-4 border-b border-gray-200 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className={[
                    "flex h-8 items-center gap-1.5 border px-2 text-xs font-semibold transition",
                    sidebarOpen
                      ? "border-gray-300 text-gray-500 hover:bg-gray-100"
                      : "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100",
                  ].join(" ")}
                  title="카테고리 열기/닫기"
                >
                  <Menu className="h-4 w-4" />
                  {!sidebarOpen && <span>카테고리</span>}
                </button>

                <div className="flex items-center gap-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    전체
                  </button>
                  {categoryPath.map((cat) => (
                    <span key={cat.id} className="flex items-center gap-1">
                      <span className="text-gray-400">›</span>
                      {cat.id === selectedCategoryId ? (
                        <span className="font-semibold text-gray-900">{cat.name}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className="text-gray-500 hover:text-blue-600"
                        >
                          {cat.name}
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <span className="text-xs text-gray-400">
                  {pageInfo.totalElements}개
                  {totalPages > 1 && ` · ${currentPage + 1}/${totalPages}페이지`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="상품명 검색"
                  className="h-8 border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
                />

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-8 border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {hasFilter && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-8 border border-gray-300 px-2.5 text-xs text-gray-600 transition hover:bg-gray-100"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 text-center text-sm text-gray-400">
              상품을 불러오는 중입니다…
            </div>
          ) : error ? (
            <div className="py-20 text-center text-sm text-red-500">
              상품 목록을 불러오지 못했습니다.
            </div>
          ) : (
            <div className={fetching ? "pointer-events-none opacity-50 transition-opacity" : ""}>
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    조건에 맞는 상품이 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
                  >
                    필터 초기화
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        className="border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        이전
                      </button>
                      <span className="text-sm text-gray-500">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                        className="border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg ${toast.error ? "bg-red-500" : "bg-gray-800"}`}>
          {toast.error ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
