import { Link } from "react-router-dom";
import CountdownPill from "./CountdownPill";
import { formatKRW } from "../../features/auction/format";
import { useCountdown } from "../../features/auction/useCountdown";

const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || "https://todaylunchmenu.s3.ap-northeast-2.amazonaws.com";

export default function AuctionCard({ auction }) {
  const { ended } = useCountdown(auction.endsAt);
  const title = auction.productTitle || "경매 상품";
  const imageSrc = auction.thumbnailKey ? `${S3_BASE_URL}/${auction.thumbnailKey}` : "/default-product.svg";

  const isWaiting = auction.status === "WAITING";

  const statusLabel = isWaiting ? "시작 전" : ended ? "종료" : "진행 중";
  const statusClass = isWaiting
    ? "bg-blue-50 text-blue-600"
    : ended
      ? "bg-gray-100 text-gray-500"
      : "bg-red-50 text-red-600";

  const actionLabel = isWaiting ? "시작 전" : ended ? "결과 보기" : "입찰 참여";
  const actionClass = isWaiting || ended
    ? "border border-gray-300 text-gray-500 hover:bg-gray-50"
    : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <article className="group flex h-full flex-col border border-gray-200 bg-white transition-shadow hover:shadow-md">
      <Link to={`/auctions/${auction.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={imageSrc}
            alt={title}
            onError={(e) => {
              if (e.currentTarget.src.endsWith("/default-product.svg")) return;
              e.currentTarget.src = "/default-product.svg";
            }}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          <CountdownPill endsAt={auction.endsAt} status={auction.status} />
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1">
          <span className={["inline-block px-1.5 py-0.5 text-xs font-semibold", statusClass].join(" ")}>
            {statusLabel}
          </span>
        </div>

        <Link to={`/auctions/${auction.id}`}>
          <h3 className="truncate text-sm font-medium leading-snug text-gray-800 hover:text-blue-600">
            {title}
          </h3>
        </Link>

        <div className="mt-auto pt-2">
          {auction.startPrice && auction.currentPrice > auction.startPrice && (
            <p className="truncate text-xs text-gray-400 line-through">
              {formatKRW(auction.startPrice)}원
            </p>
          )}
          <p className="text-base font-bold text-gray-900">
            {formatKRW(auction.currentPrice)}원
          </p>

          {!isWaiting && !ended && (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              입찰 단위 {formatKRW(auction.bidUnit)}원
            </p>
          )}

          {isWaiting && auction.startedAt && (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {new Date(auction.startedAt).toLocaleString("ko-KR", {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              시작
            </p>
          )}

          <Link to={`/auctions/${auction.id}`} className="mt-2 block">
            <button
              type="button"
              className={[
                "w-full py-2 text-sm font-semibold transition",
                actionClass,
              ].join(" ")}
            >
              {actionLabel}
            </button>
          </Link>
        </div>
      </div>
    </article>
  );
}
