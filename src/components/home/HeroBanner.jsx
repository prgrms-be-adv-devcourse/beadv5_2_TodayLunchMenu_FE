import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Gavel, Package, Zap } from "lucide-react";
import { formatKRW, pad2 } from "../../features/auction/format";
import { useCountdown } from "../../features/auction/useCountdown";

function AuctionSlide({ auction }) {
  const { h, m, s, total, ended } = useCountdown(auction.endsAt);
  const isUrgent = !ended && total < 60 * 60 * 1000;

  return (
    <div className="relative flex h-full items-center overflow-hidden bg-gradient-to-r from-blue-950 to-blue-800 px-8 sm:px-14">
      <div className="relative z-10 max-w-lg text-left">
        <span className="inline-block bg-red-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
          경매 진행 중
        </span>
        <h2 className="mt-3 line-clamp-2 text-xl font-black text-white sm:text-2xl">
          {auction.productTitle || "경매 상품"}
        </h2>
        <p className="mt-1 text-xs text-blue-300">현재 입찰가</p>
        <p className="text-2xl font-black text-white sm:text-3xl">
          {formatKRW(auction.currentPrice)}원
        </p>
        {!ended && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-blue-300">남은 시간</span>
            <span
              className={[
                "font-mono text-lg font-black tabular-nums",
                isUrgent ? "text-red-400" : "text-white",
              ].join(" ")}
            >
              {pad2(h)}:{pad2(m)}:{pad2(s)}
            </span>
          </div>
        )}
        <Link
          to={`/auctions/${auction.id}`}
          className="mt-5 inline-block bg-white px-6 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
        >
          지금 입찰하기 →
        </Link>
      </div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.07]">
        <Gavel className="h-52 w-52 text-white" strokeWidth={1} />
      </div>
    </div>
  );
}

function PromoFreeShipping() {
  return (
    <div className="flex h-full items-center bg-white px-8 text-left sm:px-14">
      <div className="flex items-center gap-8">
        <div className="hidden h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:flex">
          <Package className="h-10 w-10 text-blue-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">
            배송 혜택
          </p>
          <h2 className="mt-1 text-xl font-black text-gray-900 sm:text-2xl">
            3만원 이상 구매 시
            <br />
            무료배송
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">당일 발송 · 빠른 배송으로 편리하게</p>
          <Link
            to="/products"
            className="mt-4 inline-block bg-blue-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            쇼핑 시작하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

function PromoAuction() {
  return (
    <div className="flex h-full items-center bg-gradient-to-r from-gray-950 to-gray-800 px-8 text-left sm:px-14">
      <div className="flex items-center gap-8">
        <div className="hidden h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-white/10 sm:flex">
          <Zap className="h-10 w-10 text-yellow-400" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-400">
            실시간 경매
          </p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
            더 낮은 가격으로
            <br />
            득템하세요
          </h2>
          <p className="mt-1.5 text-sm text-gray-400">
            지금 진행 중인 경매에 참여하고 원하는 상품을 낙찰받으세요
          </p>
          <Link
            to="/auctions"
            className="mt-4 inline-block border border-white px-6 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-gray-900"
          >
            경매장 가기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HeroBanner({ auction }) {
  const slides = useMemo(
    () => [
      ...(auction ? [{ type: "auction", key: "auction" }] : []),
      { type: "promo-shipping", key: "promo-shipping" },
      { type: "promo-auction", key: "promo-auction" },
    ],
    [auction],
  );

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  const go = (index) => setCurrent(((index % slides.length) + slides.length) % slides.length);

  return (
    <div className="-mx-4 -mt-6 relative h-52 overflow-hidden sm:-mx-6 sm:h-64 lg:-mx-8">
      {slides.map((slide, i) => (
        <div
          key={slide.key}
          className={[
            "absolute inset-0 transition-opacity duration-500",
            i === current ? "opacity-100" : "pointer-events-none opacity-0",
          ].join(" ")}
        >
          {slide.type === "auction" && <AuctionSlide auction={auction} />}
          {slide.type === "promo-shipping" && <PromoFreeShipping />}
          {slide.type === "promo-auction" && <PromoAuction />}
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/25 p-1.5 text-white transition hover:bg-black/40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/25 p-1.5 text-white transition hover:bg-black/40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            onClick={() => go(i)}
            className={[
              "h-1.5 transition-all duration-300",
              i === current ? "w-5 bg-white" : "w-1.5 bg-white/50",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
