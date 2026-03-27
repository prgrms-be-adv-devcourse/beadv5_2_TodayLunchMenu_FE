import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { useAuth } from "../../features/auth/useAuth";

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "보라 머그컵",
    sku: "ZM-MUG-001",
    price: 12000,
    stock: 12,
    totalStock: 50,
    status: "ON_SALE",
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "제로마켓 키링",
    sku: "ZM-KEY-002",
    price: 8000,
    stock: 0,
    totalStock: 20,
    status: "SOLD_OUT",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "아트 포스터",
    sku: "ZM-ART-003",
    price: 22000,
    stock: 5,
    totalStock: 5,
    status: "HIDDEN",
    image:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
  },
];

const FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "ON_SALE", label: "판매중" },
  { value: "SOLD_OUT", label: "품절" },
  { value: "HIDDEN", label: "비공개" },
];

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function getStatusMeta(status) {
  switch (status) {
    case "ON_SALE":
      return {
        label: "판매중",
        className: "bg-violet-100 text-violet-700",
      };
    case "SOLD_OUT":
      return {
        label: "품절",
        className: "bg-pink-100 text-pink-700",
      };
    case "HIDDEN":
      return {
        label: "비공개",
        className: "bg-gray-100 text-gray-600",
      };
    default:
      return {
        label: status,
        className: "bg-gray-100 text-gray-600",
      };
  }
}

export default function SellerProductListPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isSeller = user?.role === "SELLER";
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = filter === "ALL" ? true : product.status === filter;
      const matchesKeyword = keyword.trim()
        ? product.name.toLowerCase().includes(keyword.toLowerCase()) ||
          product.sku.toLowerCase().includes(keyword.toLowerCase())
        : true;

      return matchesFilter && matchesKeyword;
    });
  }, [products, keyword, filter]);

  if (authLoading) {
    return (
      <PageContainer>
        <section className="py-16 text-center">
          <p className="text-sm font-medium text-gray-500">
            판매자 권한을 확인하고 있습니다.
          </p>
        </section>
      </PageContainer>
    );
  }

  if (!isSeller) {
    return <Navigate to="/seller/register" replace />;
  }

  const totalValue = products.reduce(
    (sum, product) => sum + product.price * product.stock,
    0
  );
  const liveCount = products.filter((p) => p.status === "ON_SALE").length;
  const approvalRate = 98.2;

  const handleDelete = () => {
    setProducts((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <>
      <PageContainer>
        <section className="space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
              Seller Hub
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              내 상품 관리
            </h1>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              placeholder="상품명 또는 SKU 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />

            <Button size="lg" className="w-full" onClick={() => navigate("/seller/products/new")}>
              + 새 상품 등록
            </Button>
          </div>
        </section>

        <section className="-mx-4 mt-6 overflow-x-auto px-4">
          <div className="flex min-w-max gap-2">
            {FILTERS.map((item) => {
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={[
                    "rounded-full px-5 py-2 text-sm font-bold transition",
                    active
                      ? "bg-violet-700 text-white shadow-md shadow-violet-500/20"
                      : "bg-purple-100 text-gray-500 hover:bg-purple-200",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 space-y-4">
          {filteredProducts.map((product) => {
            const statusMeta = getStatusMeta(product.status);

            return (
              <article
                key={product.id}
                className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-purple-100"
              >
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-purple-50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={[
                        "inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight",
                        statusMeta.className,
                      ].join(" ")}
                    >
                      {statusMeta.label}
                    </span>

                    <div className="flex gap-2 text-gray-400">
                      <Link
                        to={`/seller/products/${product.id}/edit`}
                        className="transition hover:text-violet-700"
                      >
                        ✎
                      </Link>
                      <button
                        type="button"
                        className="transition hover:text-red-500"
                        onClick={() => setDeleteTarget(product)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  <h3 className="truncate font-bold text-gray-900">
                    {product.name}
                  </h3>
                  <p className="mb-1 text-[10px] text-gray-400">
                    SKU: {product.sku}
                  </p>

                  <div className="flex items-end justify-between">
                    <div className="space-y-0.5">
                      <p className="text-lg font-extrabold text-violet-700">
                        {formatPrice(product.price)}원
                      </p>
                      <p className="text-[10px] text-gray-500">
                        재고:{" "}
                        <span
                          className={
                            product.stock === 0
                              ? "font-bold text-red-500"
                              : "font-bold text-violet-700"
                          }
                        >
                          {product.stock}/{product.totalStock}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] bg-purple-100/70 p-6 shadow-sm">
          <h4 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-violet-700">
            상품 요약
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">총 상품 자산</p>
              <p className="text-2xl font-black text-gray-900">
                {formatPrice(totalValue)}원
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">판매중 상품 수</p>
              <p className="text-2xl font-black text-gray-900">{liveCount}개</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">상품 수</p>
              <p className="text-2xl font-black text-gray-900">
                {products.length}개
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">노출율</p>
              <p className="text-2xl font-black text-gray-900">
                {approvalRate}%
              </p>
            </div>
          </div>
        </section>
      </PageContainer>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="상품을 삭제할까요?"
        description={
          deleteTarget
            ? `${deleteTarget.name} 상품을 목록에서 제거합니다.`
            : ""
        }
        confirmText="삭제"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}
