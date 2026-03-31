import { Link } from "react-router-dom";
import Button from "../common/Button";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

function ProductImage({ product }) {
  const initial = (product.name || "P").slice(0, 1).toUpperCase();

  if (!product.image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50 text-6xl font-black text-violet-700">
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

export default function ProductCard({ product, onAddToCart }) {
  const soldOut = product.status === "SOLD_OUT";

  return (
    <article className="overflow-hidden rounded-[28px] bg-white/75 shadow-sm ring-1 ring-purple-100 backdrop-blur">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-purple-50">
          <ProductImage product={product} />

          {product.badge ? (
            <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {product.badge}
            </span>
          ) : null}

          {soldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-gray-900">
                품절
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-violet-500">
            {product.category}
          </p>

          <Link to={`/products/${product.id}`}>
            <h3 className="line-clamp-2 text-lg font-extrabold tracking-tight text-gray-900">
              {product.name}
            </h3>
          </Link>

          <p className="mt-2 text-xl font-extrabold text-violet-700">
            {formatPrice(product.price)}원
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => onAddToCart?.(product)}
          disabled={soldOut}
        >
          {soldOut ? "품절 상품" : "장바구니 담기"}
        </Button>
      </div>
    </article>
  );
}
