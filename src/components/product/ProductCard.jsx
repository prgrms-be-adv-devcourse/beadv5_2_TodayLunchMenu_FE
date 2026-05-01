import { Link } from "react-router-dom";

function formatPrice(price) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export default function ProductCard({ product, onAddToCart }) {
  const soldOut = product.status === "SOLD_OUT" || product.stockCount <= 0;

  return (
    <article className="group flex h-full flex-col border border-sand bg-white transition-shadow hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-fog">
          <img
            src={product.image || "/default-product.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="bg-white/90 px-3 py-1 text-xs font-bold text-plum">
                품절
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="mb-1 truncate text-xs text-silver">{product.category}</p>

        <Link to={`/products/${product.id}`}>
          <h3 className="truncate text-sm font-medium leading-snug text-plum hover:text-plum">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          <p className="text-base font-bold text-plum">
            {formatPrice(product.price)}원
          </p>

          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={soldOut}
            className={[
              "mt-2 w-full py-2 text-sm font-semibold transition",
              soldOut
                ? "cursor-not-allowed bg-fog text-silver"
                : "bg-brand text-white hover:bg-brand",
            ].join(" ")}
          >
            {soldOut ? "품절" : "장바구니 담기"}
          </button>
        </div>
      </div>
    </article>
  );
}
