import { Link } from "react-router-dom";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

function formatSimilarity(score) {
  if (!score) {
    return "추천";
  }

  return `${Math.round(score * 100)}% 유사`;
}

function RecommendedProductImage({ product }) {
  const initial = (product.name || "P").slice(0, 1).toUpperCase();

  if (!product.image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50 text-4xl font-black text-violet-700">
        {initial}
      </div>
    );
  }

  return (
    <img
      src={product.image}
      alt={product.name}
      className="h-full w-full object-cover transition duration-500 hover:scale-105"
    />
  );
}

function RecommendationSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden border border-gray-200 bg-white"
        >
          <div className="aspect-square animate-pulse bg-purple-100" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-16 animate-pulse rounded-full bg-purple-100" />
            <div className="h-4 w-full animate-pulse rounded-full bg-purple-100" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-purple-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendedProductCard({ recommendation }) {
  const { product, similarityScore } = recommendation;
  const soldOut = product.status === "SOLD_OUT" || product.stockCount <= 0;

  return (
    <article className="group overflow-hidden border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-purple-50">
          <RecommendedProductImage product={product} />

          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">
            {formatSimilarity(similarityScore)}
          </span>

          {soldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="bg-white/90 px-3 py-1 text-xs font-bold text-gray-900">
                품절
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="p-2.5">
        <p className="mb-0.5 text-xs text-violet-500">
          {product.category}
        </p>

        <Link to={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-xs font-medium leading-snug text-gray-900 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-sm font-bold text-red-600">
          {formatPrice(product.price)}원
        </p>
      </div>
    </article>
  );
}

export default function ProductRecommendationSection({
  recommendations,
  loading,
  error,
}) {
  return (
    <section className="mt-8 border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">
            AI Recommendation
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
            AI 추천 상품
          </h2>
        </div>
        <p className="text-sm font-medium text-gray-500">
          현재 상품과 비슷한 상품을 골라봤어요.
        </p>
      </div>

      {loading ? <RecommendationSkeleton /> : null}

      {!loading && error ? (
        <div className="rounded-2xl bg-purple-50/70 px-4 py-6 text-center text-sm font-medium text-gray-500">
          추천 상품을 불러오지 못했습니다.
        </div>
      ) : null}

      {!loading && !error && recommendations.length === 0 ? (
        <div className="rounded-2xl bg-purple-50/70 px-4 py-6 text-center text-sm font-medium text-gray-500">
          아직 추천할 만한 연관 상품이 없습니다.
        </div>
      ) : null}

      {!loading && !error && recommendations.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {recommendations.map((recommendation) => (
            <RecommendedProductCard
              key={recommendation.product.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
