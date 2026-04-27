import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import { useProduct } from "../../features/product/useProducts";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getStatusMeta(status) {
  switch (status) {
    case "ACTIVE":
      return { label: "판매중", className: "bg-blue-100 text-blue-700" };
    case "SOLD_OUT":
      return { label: "품절", className: "bg-pink-100 text-pink-700" };
    case "INACTIVE":
      return { label: "비공개", className: "bg-gray-100 text-gray-600" };
    default:
      return { label: status ?? "-", className: "bg-gray-100 text-gray-600" };
  }
}

export default function SellerProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { product, loading, error } = useProduct(productId);

  if (loading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-gray-500">상품을 불러오는 중입니다...</p>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-red-500">
          {error?.message || "상품 정보를 불러오지 못했습니다."}
        </p>
        <Button variant="ghost" onClick={() => navigate("/seller/products")}>
          목록으로 돌아가기
        </Button>
      </PageContainer>
    );
  }

  const statusMeta = getStatusMeta(product.status);

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
            Seller Hub
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
            상품 상세
          </h1>
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
            statusMeta.className,
          ].join(" ")}
        >
          {statusMeta.label}
        </span>
      </div>

      <section className="mb-6 overflow-hidden bg-blue-50">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[4/3] h-full w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-8xl font-black text-blue-700">
            {(product.name || "P").slice(0, 1).toUpperCase()}
          </div>
        )}
      </section>

      <section className="mb-6 space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-500">
          {product.category}
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {product.name}
        </h2>
        <p className="text-xl font-extrabold text-blue-700">
          {formatPrice(product.price)}원
        </p>
        {product.description && (
          <p className="text-sm leading-relaxed text-gray-600">{product.description}</p>
        )}
      </section>

      <section className="mb-6 bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <h3 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
          판매 현황
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">상태</p>
            <p className="mt-1 text-lg font-extrabold text-gray-900">{statusMeta.label}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">재고</p>
            <p
              className={[
                "mt-1 text-lg font-extrabold",
                product.stockCount === 0 ? "text-red-500" : "text-gray-900",
              ].join(" ")}
            >
              {product.stockCount}개
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">등록일</p>
            <p className="mt-1 text-sm font-bold text-gray-900">{formatDate(product.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-500">상품 ID</p>
            <p className="mt-1 truncate text-xs font-mono text-gray-500">{product.id}</p>
          </div>
        </div>
      </section>

      <section className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => navigate("/seller/products")}
        >
          목록으로
        </Button>
        <Button
          className="flex-1"
          onClick={() => navigate(`/seller/products/${product.id}/edit`)}
        >
          수정하기
        </Button>
      </section>
    </PageContainer>
  );
}
