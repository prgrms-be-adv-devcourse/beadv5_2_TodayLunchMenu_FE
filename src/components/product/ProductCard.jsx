import { Link } from "react-router-dom";
import Button from "../common/Button";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

function ProductImage({ product }) {
  return (
    <img
      src={product.image || "/default-product.svg"}
      alt={product.name}
      className="h-full w-full object-cover transition duration-500 hover:scale-105"
    />
  );
}

export default function ProductCard({ product, onAddToCart }) {
  const soldOut = product.status === "SOLD_OUT";

  return (
    <article className="overflow-hidden rounded-[18px] bg-white/75 shadow-sm ring-1 ring-purple-100 backdrop-blur">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-purple-50">
          <ProductImage product={product} />

          {product.badge ? (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              {product.badge}
            </span>
          ) : null}

          {soldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-gray-900">
                품절
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="space-y-2 p-2.5">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">
            {product.category}
          </p>

          <Link to={`/products/${product.id}`}>
            <h3 className="line-clamp-2 text-[13px] font-extrabold leading-snug tracking-tight text-gray-900">
              {product.name}
            </h3>
          </Link>

          <p className="mt-1 text-sm font-extrabold text-violet-700">
            {formatPrice(product.price)}원
          </p>
        </div>

        <Button
          size="sm"
          className="h-8 w-full px-3 text-[11px]"
          onClick={() => onAddToCart?.(product)}
          disabled={soldOut}
        >
          {soldOut ? "품절 상품" : "장바구니 담기"}
        </Button>
      </div>
    </article>
  );
}
