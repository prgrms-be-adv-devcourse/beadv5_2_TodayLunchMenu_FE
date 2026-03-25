import { useMemo, useState } from "react";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ProductCard from "../../components/product/ProductCard";

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "보라 머그컵",
    category: "리빙",
    price: 12000,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80",
    badge: "NEW",
    status: "ON_SALE",
  },
  {
    id: 2,
    name: "제로마켓 키링",
    category: "굿즈",
    price: 8000,
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
    badge: "BEST",
    status: "ON_SALE",
  },
  {
    id: 3,
    name: "아트 포스터",
    category: "아트",
    price: 22000,
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    badge: "LIMITED",
    status: "ON_SALE",
  },
  {
    id: 4,
    name: "스티커 팩",
    category: "굿즈",
    price: 5000,
    image:
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80",
    badge: "",
    status: "ON_SALE",
  },
  {
    id: 5,
    name: "무드 조명",
    category: "리빙",
    price: 39000,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    badge: "HOT",
    status: "SOLD_OUT",
  },
  {
    id: 6,
    name: "컬렉션 엽서 세트",
    category: "문구",
    price: 9000,
    image:
      "https://images.unsplash.com/photo-1516542076529-1ea3854896f2?auto=format&fit=crop&w=800&q=80",
    badge: "",
    status: "ON_SALE",
  },
];

const CATEGORY_OPTIONS = ["전체", "굿즈", "리빙", "아트", "문구"];
const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "priceAsc", label: "가격 낮은순" },
  { value: "priceDesc", label: "가격 높은순" },
  { value: "name", label: "이름순" },
];

export default function ProductsListPage() {
    // 상품 목록 페이지에서 필요한 상태들
    // products
    // filter / sort
    // loading
    // error
    // pagination
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("latest");

  const filteredProducts = useMemo(() => {
    let result = [...MOCK_PRODUCTS];

    if (category !== "전체") {
      result = result.filter((product) => product.category === category);
    }

    if (keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerKeyword) ||
          product.category.toLowerCase().includes(lowerKeyword)
      );
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
        result.sort((a, b) => b.id - a.id);
        break;
    }

    return result;
  }, [keyword, category, sort]);

  const handleReset = () => {
    setKeyword("");
    setCategory("전체");
    setSort("latest");
  };

  return (
    <PageContainer>
      <PageHeader
        title="상품 목록"
        action={
          <span className="text-sm font-medium text-gray-500">
            총 {filteredProducts.length}개
          </span>
        }
      />

      <section className="mb-6 rounded-[28px] bg-white/70 p-4 shadow-sm ring-1 ring-purple-100 backdrop-blur">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="상품명 또는 카테고리 검색"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-14 rounded-xl bg-purple-100/70 px-4 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-violet-300"
          >
            {CATEGORY_OPTIONS.map((option) => (
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
        {CATEGORY_OPTIONS.map((option) => {
          const active = category === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
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

      {filteredProducts.length === 0 ? (
        <section className="rounded-[32px] bg-white/75 px-6 py-16 text-center shadow-sm ring-1 ring-purple-100">
          <p className="mb-2 text-lg font-bold text-gray-900">
            조건에 맞는 상품이 없어요
          </p>
          <p className="mb-6 text-sm text-gray-500">
            검색어나 카테고리 조건을 다시 바꿔보세요.
          </p>
          <Button onClick={handleReset}>필터 초기화</Button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => {
                console.log("장바구니 추가", product.id);
              }}
            />
          ))}
        </section>
      )}
    </PageContainer>
  );
}