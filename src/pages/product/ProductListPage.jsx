import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import ProductCard from "../../components/product/ProductCard";
import { useCart } from "../../features/cart/useCart";
import { useProducts } from "../../features/product/useProducts";

const STATUS_OPTIONS = ["전체", "판매중", "품절"];
const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "priceAsc", label: "가격 낮은순" },
  { value: "priceDesc", label: "가격 높은순" },
  { value: "name", label: "이름순" },
];

export default function ProductListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [sort, setSort] = useState("latest");
  const { addToCart } = useCart({ autoLoad: false });
  const { products, loading, fetching, error } = useProducts({ page: 0, size: 50, sort: "createdAt,desc" });

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => product.type !== "AUCTION");

    if (statusFilter === "판매중") {
      result = result.filter((product) => product.status !== "SOLD_OUT" && product.stockCount > 0);
    }

    if (statusFilter === "품절") {
      result = result.filter((product) => product.status === "SOLD_OUT" || product.stockCount <= 0);
    }

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      result = result.filter((product) => product.name.toLowerCase().includes(lowerKeyword));
    }

    switch (sort) {
      case "priceAsc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
        break;
      case "latest":
      default:
        result.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    return result;
  }, [keyword, products, sort, statusFilter]);

  const handleReset = () => {
    setKeyword("");
    setStatusFilter("전체");
    setSort("latest");
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
    <PageContainer>
      <PageHeader
        title="상품 목록"
        action={<span className="text-sm font-medium text-gray-500">총 {filteredProducts.length}개</span>}
      />

      <section className="mb-6 rounded-[28px] bg-white/70 p-4 shadow-sm ring-1 ring-purple-100 backdrop-blur">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="상품명을 검색해 보세요"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-14 rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-14 rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Button variant="secondary" onClick={handleReset} className="h-14">
            초기화
          </Button>
        </div>
      </section>

      <section className="mb-6 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => {
          const active = statusFilter === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setStatusFilter(option)}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                active
                  ? "bg-violet-700 text-white shadow"
                  : "bg-purple-100 text-violet-800 hover:bg-purple-200",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </section>

      {loading ? (
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="text-lg font-bold text-gray-900">상품을 불러오는 중입니다.</p>
        </section>
      ) : error ? (
        <section className="rounded-[32px] bg-red-50 px-6 py-16 text-center shadow-sm ring-1 ring-red-100">
          <p className="mb-2 text-lg font-bold text-red-700">상품 목록을 불러오지 못했습니다.</p>
          <p className="text-sm text-red-500">{error.message || "잠시 후 다시 시도해 주세요."}</p>
        </section>
      ) : (
        <div className={fetching ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}>
          {filteredProducts.length === 0 ? (
            <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
              <p className="mb-2 text-lg font-bold text-gray-900">조건에 맞는 상품이 없습니다.</p>
              <p className="mb-6 text-sm text-gray-500">검색어 또는 필터 조건을 다시 조정해 보세요.</p>
              <Button onClick={handleReset}>필터 초기화</Button>
            </section>
          ) : (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}
