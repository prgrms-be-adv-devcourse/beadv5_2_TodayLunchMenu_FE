import { Link } from "react-router-dom";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export default function ProductCard({ product, onAddToCart }) {
  const soldOut = product.status === "SOLD_OUT" || product.stockCount <= 0;

  return (
    <article className="group border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={product.image || "/default-product.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="bg-white/90 px-3 py-1 text-xs font-bold text-gray-900">
                품절
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-2.5">
        <p className="mb-0.5 text-[10px] text-gray-400">{product.category}</p>

        <Link to={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-[12px] font-medium leading-snug text-gray-900 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 text-sm font-bold text-red-600">
          {formatPrice(product.price)}원
        </p>

        <button
          type="button"
          onClick={() => onAddToCart?.(product)}
          disabled={soldOut}
          className={[
            "mt-2 w-full border py-1.5 text-[11px] font-semibold transition",
            soldOut
              ? "cursor-not-allowed border-gray-200 text-gray-400"
              : "border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white",
          ].join(" ")}
        >
          {soldOut ? "품절" : "장바구니 담기"}
        </button>
      </div>
    </article>
  );
}
