import { Link } from "react-router-dom";

import Button from "../common/Button";
import CountdownPill from "./CountdownPill";
import { formatKRW } from "../../features/auction/format";
import { useCountdown } from "../../features/auction/useCountdown";

export default function AuctionCard({ auction, productImage }) {
  const { ended } = useCountdown(auction.endsAt);
  const title = auction.productTitle || "경매 상품";
  const initial = title.slice(0, 1).toUpperCase();

  return (
    <article className="overflow-hidden rounded-[28px] bg-white/75 shadow-sm ring-1 ring-purple-100 backdrop-blur transition hover:shadow-md">
      <Link to={`/auctions/${auction.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50">
          {productImage ? (
            <img
              src={productImage}
              alt={title}
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="select-none text-8xl font-black tracking-tight text-violet-700">
                {initial}
              </span>
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-wider text-violet-700 backdrop-blur">
            Lot {auction.id?.slice(0, 6).toUpperCase()}
          </span>
          <CountdownPill endsAt={auction.endsAt} status={auction.status} />
        </div>
      </Link>

      <div className="p-5">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">
          경매
        </p>
        <Link to={`/auctions/${auction.id}`}>
          <h3 className="mb-3 line-clamp-2 text-base font-extrabold tracking-tight text-gray-900">
            {title}
          </h3>
        </Link>

        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-xl font-extrabold tracking-tight text-violet-700 tabular-nums">
            {formatKRW(auction.currentPrice)}원
          </span>
          <span className="text-xs font-medium text-gray-500">
            {auction.status === "WAITING"
              ? auction.startedAt
                ? new Date(auction.startedAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + " 시작"
                : "경매 시작 전"
              : ended
                ? "마감"
                : auction.hasBid
                  ? `입찰 단위 ${formatKRW(auction.bidUnit)}원`
                  : "첫 입찰 대기"}
          </span>
        </div>

        <Link to={`/auctions/${auction.id}`}>
          <Button className="w-full">
            {auction.status === "WAITING" ? "시작 전" : ended ? "결과 보기" : "입찰 참여"}
          </Button>
        </Link>
      </div>
    </article>
  );
}
