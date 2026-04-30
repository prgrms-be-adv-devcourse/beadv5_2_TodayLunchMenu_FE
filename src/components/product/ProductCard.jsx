import { Link } from "react-router-dom";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export default function ProductCard({ product, onAddToCart }) {
  const soldOut = product.status === "SOLD_OUT" || product.stockCount <= 0;

  return (
    <article className="group flex flex-col border border-gray-200 bg-white transition-shadow hover:shadow-md">
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

      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1 truncate text-xs text-gray-400">{product.category}</p>

        <Link to={`/products/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-gray-800 hover:text-blue-600">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          <p className="text-base font-bold text-gray-900">
            {formatPrice(product.price)}원
          </p>

          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={soldOut}
            className={[
              "mt-2 w-full py-2 text-sm font-semibold transition",
              soldOut
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-blue-600 text-white hover:bg-blue-700",
            ].join(" ")}
          >
            {soldOut ? "품절" : "장바구니 담기"}
          </button>
        </div>
      </div>
    </article>
  );
}
