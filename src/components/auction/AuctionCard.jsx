import { Link } from "react-router-dom";

import CountdownPill from "./CountdownPill";
import { formatKRW } from "../../features/auction/format";
import { useCountdown } from "../../features/auction/useCountdown";

export default function AuctionCard({ auction, productImage }) {
  const { ended } = useCountdown(auction.endsAt);
  const title = auction.productTitle || "경매 상품";

  const isWaiting = auction.status === "WAITING";

  const statusLabel = isWaiting ? "시작 전" : ended ? "종료" : "진행 중";
  const statusClass = isWaiting
    ? "border-blue-200 bg-blue-50 text-blue-600"
    : ended
      ? "border-gray-200 bg-gray-100 text-gray-500"
      : "border-red-200 bg-red-50 text-red-600";

  const actionLabel = isWaiting ? "시작 전" : ended ? "결과 보기" : "입찰 참여";
  const actionClass = isWaiting
    ? "border-blue-300 text-blue-600 hover:bg-blue-50"
    : ended
      ? "border-gray-300 text-gray-500 hover:bg-gray-50"
      : "border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white";

  return (
    <article className="group border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <Link to={`/auctions/${auction.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={productImage || "/default-product.svg"}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <CountdownPill endsAt={auction.endsAt} status={auction.status} />
        </div>
      </Link>

      <div className="p-2.5">
        <div className="mb-1">
          <span
            className={[
              "border px-1.5 py-0.5 text-[10px] font-semibold",
              statusClass,
            ].join(" ")}
          >
            {statusLabel}
          </span>
        </div>

        <Link to={`/auctions/${auction.id}`}>
          <h3 className="line-clamp-2 text-[12px] font-medium leading-snug text-gray-900 hover:text-blue-600">
            {title}
          </h3>
        </Link>

        <p className="mt-1 text-sm font-bold text-red-600">
          {formatKRW(auction.currentPrice)}원
        </p>

        {!isWaiting && !ended && (
          <p className="mt-0.5 text-[10px] text-gray-400">
            입찰 단위 {formatKRW(auction.bidUnit)}원
          </p>
        )}

        {isWaiting && auction.startedAt && (
          <p className="mt-0.5 text-[10px] text-gray-400">
            {new Date(auction.startedAt).toLocaleString("ko-KR", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            시작
          </p>
        )}

        <Link to={`/auctions/${auction.id}`} className="block">
          <button
            type="button"
            className={[
              "mt-2 w-full border py-1.5 text-[11px] font-semibold transition",
              actionClass,
            ].join(" ")}
          >
            {actionLabel}
          </button>
        </Link>
      </div>
    </article>
  );
}
