import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../components/product/ProductCard";
import { useCart } from "../../features/cart/useCart";
import { useCategories, useProducts } from "../../features/product/useProducts";

const STATUS_OPTIONS = ["전체", "판매중", "품절"];
const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "priceAsc", label: "가격 낮은순" },
  { value: "priceDesc", label: "가격 높은순" },
  { value: "name", label: "이름순" },
];

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
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sort, setSort] = useState("latest");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { addToCart } = useCart({ autoLoad: false });
  const { products, loading, fetching, error } = useProducts({
    page: 0,
    size: 50,
    sort: "createdAt,desc",
  });
  const { categories } = useCategories();

  const categoryTree = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId);
    const getChildren = (parentId) =>
      categories.filter((c) => c.parentId === parentId);

    return roots.map((root) => ({
      ...root,
      children: getChildren(root.id).map((child) => ({
        ...child,
        children: getChildren(child.id),
      })),
    }));
  }, [categories]);

  const descendantMap = useMemo(() => {
    const map = {};

    function collectIds(categoryId) {
      if (map[categoryId]) return map[categoryId];
      const children = categories.filter((c) => c.parentId === categoryId);
      const ids = [categoryId, ...children.flatMap((c) => collectIds(c.id))];
      map[categoryId] = ids;
      return ids;
    }

    categories.forEach((c) => collectIds(c.id));
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.type !== "AUCTION");

    if (selectedCategoryId) {
      const ids = descendantMap[selectedCategoryId] ?? [selectedCategoryId];
      result = result.filter((p) => ids.includes(p.categoryId));
    }

    if (statusFilter === "판매중") {
      result = result.filter(
        (p) => p.status !== "SOLD_OUT" && p.stockCount > 0,
      );
    } else if (statusFilter === "품절") {
      result = result.filter(
        (p) => p.status === "SOLD_OUT" || p.stockCount <= 0,
      );
    }

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(lowerKeyword),
      );
    }

    switch (sort) {
      case "priceAsc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "name":
        result = [...result].sort((a, b) =>
          a.name.localeCompare(b.name, "ko"),
        );
        break;
      default:
        result = [...result].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
    }

    return result;
  }, [keyword, products, sort, statusFilter, selectedCategoryId, descendantMap]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleReset = () => {
    setKeyword("");
    setStatusFilter("전체");
    setSort("latest");
    setSelectedCategoryId(null);
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      window.alert("장바구니에 담았습니다.");
    } catch (nextError) {
      if (nextError?.status === 401) {
        navigate("/login");
        return;
      }
      window.alert(nextError?.message || "장바구니에 담지 못했습니다.");
    }
  };

  return (
    <div className="flex items-start gap-0">
      {/* Category Sidebar */}
      <aside
        className={[
          "shrink-0 transition-all duration-200",
          sidebarOpen ? "w-52" : "w-0 overflow-hidden",
        ].join(" ")}
      >
        <div className="mr-4 overflow-hidden border border-gray-200 bg-white">
          <div className="bg-gray-800 px-4 py-2.5">
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
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-gray-500 transition hover:bg-gray-100"
                title="카테고리 열기/닫기"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <line x1="2" y1="12" x2="14" y2="12" />
                </svg>
              </button>

              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId(null)}
                  className="text-gray-500 hover:text-blue-600"
                >
                  전체
                </button>
                {selectedCategory && (
                  <>
                    <span className="text-gray-400">&gt;</span>
                    <span className="font-semibold text-gray-900">
                      {selectedCategory.name}
                    </span>
                  </>
                )}
              </div>

              <span className="text-xs text-gray-400">
                {filteredProducts.length}개
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="상품명 검색"
                className="h-8 rounded border border-gray-300 px-3 text-sm outline-none focus:border-blue-500"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-8 rounded border border-gray-300 px-2 text-sm outline-none focus:border-blue-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {(keyword || statusFilter !== "전체" || sort !== "latest" || selectedCategoryId) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-8 rounded border border-gray-300 px-2.5 text-xs text-gray-600 transition hover:bg-gray-100"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-500">
            상품을 불러오는 중입니다…
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-red-500">
            상품 목록을 불러오지 못했습니다.
          </div>
        ) : (
          <div
            className={
              fetching ? "pointer-events-none opacity-50 transition-opacity" : ""
            }
          >
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  조건에 맞는 상품이 없습니다.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
