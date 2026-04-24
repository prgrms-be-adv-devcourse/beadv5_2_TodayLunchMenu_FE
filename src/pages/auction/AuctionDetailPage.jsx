import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import AiBidRecommendation from "../../components/auction/AiBidRecommendation";
import BigCountdown from "../../components/auction/BigCountdown";
import CountdownPill from "../../components/auction/CountdownPill";
import { recommendAuctionBidPriceApi } from "../../features/auction/auctionAiApi";
import { useAuth } from "../../features/auth/useAuth";
import { formatKRW, statusLabel } from "../../features/auction/format";
import { getProductDetailApi } from "../../features/product/productApi";
import {
  placeBid,
  useAuction,
  useAuctionBids,
} from "../../features/auction/useAuctions";
import { useAuctionSocket } from "../../features/auction/useAuctionSocket";
import { useCountdown } from "../../features/auction/useCountdown";

const SHOW_BID_STATUSES = new Set(["ACTIVE", "OUTBID", "WINNING", "PAYMENT_COMPLETED"]);

function useAnimatedNumber(value) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) {
      return undefined;
    }

    const from = prev.current;
    const to = value;
    const duration = 420;
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    prev.current = value;

    return () => cancelAnimationFrame(raf);
  }, [value]);

  return display;
}

function relativeTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const diff = Date.now() - timestamp;
  if (diff < 1000) return "방금";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return `${Math.floor(diff / 1000)}초 전`;
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return new Date(timestamp).toLocaleString("ko-KR");
}

function BidRow({ bid, isTop, isYou }) {
  const name = isYou ? "나" : (bid.bidderId || "익명").toString().slice(0, 6);

  return (
    <li
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-3 transition",
        isTop ? "bg-violet-50 ring-1 ring-violet-200" : "",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold",
          isYou ? "bg-violet-700 text-white" : "bg-purple-100 text-violet-700",
        ].join(" ")}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-gray-900">{name}</span>
          {isTop && (
            <span className="rounded-full bg-violet-700 px-2 py-0.5 text-[10px] font-bold text-white">
              최고가
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-400">{relativeTime(bid.createdAt)}</span>
      </div>
      <span
        className={[
          "text-base font-extrabold tabular-nums",
          isTop ? "text-violet-700" : "text-gray-900",
        ].join(" ")}
      >
        {formatKRW(bid.amount)}원
      </span>
    </li>
  );
}

export default function AuctionDetailPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { auction, setAuction, loading, error, reload } = useAuction(auctionId);
  const { bids, prependBid } = useAuctionBids(auctionId, { size: 30 });
  const { ended } = useCountdown(auction?.endsAt);
  const [productImage, setProductImage] = useState(null);
  const [productName, setProductName] = useState(null);
  const [bidInput, setBidInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [aiBidRecommendation, setAiBidRecommendation] = useState(null);
  const [aiBidError, setAiBidError] = useState("");
  const [aiBidLoading, setAiBidLoading] = useState(false);
  const [aiRecommendationContext, setAiRecommendationContext] = useState(null);

  const currentPrice = auction?.currentPrice ?? 0;
  const bidUnit = auction?.bidUnit ?? 0;
  const nextMin = auction?.hasBid ? currentPrice + bidUnit : currentPrice;
  const animatedPrice = useAnimatedNumber(currentPrice);

  useEffect(() => {
    if (!auction?.productId) return;
    let cancelled = false;
    getProductDetailApi(auction.productId)
      .then((product) => {
        if (!cancelled) {
          setProductImage(product.image ?? null);
          setProductName(product.name ?? null);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [auction?.productId]);

  useEffect(() => {
    if (auction?.status !== "WAITING") return undefined;
    const startedAtPassed = auction.startedAt && auction.startedAt <= Date.now();
    const interval = startedAtPassed ? 2_000 : 10_000;
    const timer = setInterval(reload, interval);
    return () => clearInterval(timer);
  }, [auction?.status, auction?.startedAt, reload]);

  useEffect(() => {
    if (!auction) {
      return;
    }
    if (bidInput === "" || Number(bidInput) < nextMin) {
      setBidInput(String(nextMin));
    }
  }, [auction?.currentPrice, auction?.bidUnit, nextMin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const myId = user?.memberId;

  const handleBidEvent = useCallback(
    (payload) => {
      if (!payload || !payload.auctionId || payload.auctionId !== auctionId) {
        return;
      }

      const bidPrice = Number(payload.bidPrice);
      const endAt = payload.endAt ? new Date(payload.endAt).getTime() : null;

      setAuction((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          currentPrice: Number.isNaN(bidPrice) ? prev.currentPrice : bidPrice,
          hasBid: true,
          endsAt: endAt || prev.endsAt,
        };
      });

      prependBid({
        id: `live-${payload.bidderId}-${endAt ?? Date.now()}`,
        auctionId,
        bidderId: payload.bidderId,
        amount: bidPrice,
        status: "ACTIVE",
        createdAt: Date.now(),
      });
    },
    [auctionId, prependBid, setAuction]
  );

  const handleUserMessage = useCallback((message) => {
    setToast({ type: "error", message });
  }, []);

  useAuctionSocket(auctionId, handleBidEvent, myId, handleUserMessage);

  const validBids = useMemo(() => {
    return bids.filter((bid) => SHOW_BID_STATUSES.has(bid.status));
  }, [bids]);

  const quicks = useMemo(() => {
    if (!auction || bidUnit <= 0) return [];
    const base = nextMin;
    return [base, base + bidUnit * 2, base + bidUnit * 5, base + bidUnit * 10];
  }, [auction, bidUnit, nextMin]);
  const aiRecommendationStaleReason = useMemo(() => {
    if (!aiRecommendationContext) {
      return "";
    }
    if (aiRecommendationContext.currentPrice !== currentPrice) {
      return "현재 최고가가 변경되어 추천 기준이 달라졌어요.";
    }
    if (aiRecommendationContext.nextMinimumBidPrice !== nextMin) {
      return "다음 최소 입찰가가 바뀌어 추천을 다시 계산하는 것이 좋아요.";
    }
    if (aiRecommendationContext.bidCount !== bids.length) {
      return "입찰 수가 늘어나 경매 흐름이 달라졌어요.";
    }
    return "";
  }, [aiRecommendationContext, bids.length, currentPrice, nextMin]);
  const isAiRecommendationStale = Boolean(aiRecommendationStaleReason);

  const requestAiBidRecommendation = async () => {
    if (!auction) {
      return;
    }

    try {
      setAiBidLoading(true);
      setAiBidError("");

      const remainingSeconds = auction.endsAt
        ? Math.max(0, Math.floor((auction.endsAt - Date.now()) / 1000))
        : null;
      const recommendation = await recommendAuctionBidPriceApi({
        auctionId: auction.id,
        productId: auction.productId,
        currentBidPrice: currentPrice,
        startPrice: auction.startPrice,
        productName: auction.productTitle ?? null,
        bidUnit: auction.bidUnit,
        nextMinimumBidPrice: nextMin,
        bidCount: bids.length,
        remainingSeconds,
        auctionStatus: auction.status,
        hasBid: auction.hasBid,
      });
      const recommendedBidPrice = Math.max(
        recommendation.recommendedBidPrice,
        nextMin
      );
      const expectedFinalPrice = Math.max(
        recommendation.expectedFinalPrice,
        recommendedBidPrice
      );

      setAiBidRecommendation({
        ...recommendation,
        recommendedBidPrice,
        expectedFinalPrice,
      });
      setAiRecommendationContext({
        currentPrice,
        nextMinimumBidPrice: nextMin,
        bidCount: bids.length,
      });
    } catch (nextError) {
      setAiBidRecommendation(null);
      setAiRecommendationContext(null);
      setAiBidError(
        nextError?.message || "AI 추천 입찰가를 불러오지 못했습니다."
      );
    } finally {
      setAiBidLoading(false);
    }
  };

  const applyAiBidRecommendation = () => {
    if (!aiBidRecommendation?.recommendedBidPrice) {
      return;
    }

    setBidInput(String(aiBidRecommendation.recommendedBidPrice));
    setToast({ type: "success", message: "AI 추천가를 입력했습니다." });
  };

  const place = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (ended) return;

    const amount = Number(bidInput);
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      setToast({ type: "error", message: "올바른 금액을 입력해 주세요." });
      return;
    }
    if (amount > 999_999_999) {
      setToast({ type: "error", message: "입찰가는 9억 9천만원을 초과할 수 없습니다." });
      return;
    }
    if (amount % 100 !== 0) {
      setToast({ type: "error", message: "입찰가는 100원 단위로 입력해 주세요." });
      return;
    }
    if (amount < nextMin) {
      setToast({ type: "error", message: `${formatKRW(nextMin)}원부터 입찰할 수 있어요.` });
      return;
    }

    try {
      setSubmitting(true);
      await placeBid(auctionId, amount);
      setToast({ type: "success", message: "입찰 요청이 접수됐습니다. 처리 중..." });
      reload();
    } catch (nextError) {
      if (nextError?.status === 401) {
        navigate("/login");
        return;
      }
      setToast({
        type: "error",
        message: nextError?.message || "입찰에 실패했습니다.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-gray-500">경매 정보를 불러오는 중입니다.</p>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-red-600">
          {error.message || "경매 정보를 불러오지 못했습니다."}
        </p>
      </PageContainer>
    );
  }

  if (!auction) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-gray-500">경매를 찾을 수 없습니다.</p>
      </PageContainer>
    );
  }

  const isSeller = myId && auction.sellerId && myId === auction.sellerId;
  const isWaiting = auction.status === "WAITING";
  const topBid = bids[0];

  return (
    <PageContainer>
      <Link
        to="/auctions"
        className="mb-4 inline-block text-sm font-semibold text-violet-700 hover:underline"
      >
        ← 경매장으로
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <section className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[32px] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50 ring-1 ring-purple-100">
            <span className="absolute left-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-wider text-violet-700 backdrop-blur">
              Lot {auction.id?.slice(0, 6).toUpperCase()}
            </span>
            <CountdownPill endsAt={auction.endsAt} status={auction.status} />
            <img
              src={productImage || "/default-product.svg"}
              alt={auction.productTitle || "경매 상품"}
              className="h-full w-full object-cover"
            />
          </section>

          <section className="mt-6 rounded-[28px] bg-white/80 p-6 shadow-sm ring-1 ring-purple-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">
              경매 · {statusLabel(auction.status)}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
              {auction.productTitle ?? productName ?? auction.productId?.slice(0, 8)}
            </h1>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-purple-100 pt-5 text-sm text-gray-500">
              <span>
                시작가
                <b className="ml-1 font-extrabold tabular-nums text-gray-900">
                  {formatKRW(auction.startPrice)}원
                </b>
              </span>
              <span>
                입찰 단위
                <b className="ml-1 font-extrabold tabular-nums text-gray-900">
                  {formatKRW(auction.bidUnit)}원
                </b>
              </span>
              <span>
                총 입찰
                <b className="ml-1 font-extrabold tabular-nums text-gray-900">
                  {bids.length}회
                </b>
              </span>
            </div>
          </section>

          <section className="mt-4 rounded-[28px] bg-white/80 p-6 shadow-sm ring-1 ring-purple-100">
            <div className="mb-4 flex items-baseline justify-between">
              <h4 className="text-base font-extrabold tracking-tight">입찰 내역</h4>
              <span className="text-xs font-medium text-gray-500">총 {validBids.length}건</span>
            </div>

            {validBids.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-500">
                아직 입찰이 없어요.
              </p>
            ) : (
              <ul className="max-h-[360px] space-y-1 overflow-y-auto">
                {validBids.map((bid, index) => (
                  <BidRow
                    key={bid.id}
                    bid={bid}
                    isTop={index === 0}
                    isYou={myId && bid.bidderId === myId}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] bg-white/80 p-6 shadow-sm ring-1 ring-purple-100">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-500">
              {ended ? "낙찰가" : "현재가"}
            </span>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-violet-700 tabular-nums">
              {formatKRW(animatedPrice)}
              <span className="ml-1 text-lg font-bold text-violet-500">원</span>
            </p>
            <p className="mt-2 text-xs font-medium text-gray-500">
              {auction.hasBid ? `최고 입찰 · ${topBid ? relativeTime(topBid.createdAt) : ""}` : "첫 입찰을 기다리고 있어요"}
            </p>
            <div className="mt-5 border-t border-purple-100 pt-5">
              <BigCountdown endsAt={auction.endsAt} />
            </div>
          </div>

          {isWaiting && (
            <div className="rounded-[28px] bg-white/80 p-6 shadow-sm ring-1 ring-purple-100">
              <p className="text-sm font-medium text-gray-500">경매가 아직 시작되지 않았어요.</p>
              {auction.startedAt && (
                <p className="mt-1 text-sm font-bold text-violet-700">
                  시작 시간: {new Date(auction.startedAt).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          )}

          {!ended && !isSeller && !isWaiting && (
            <div className="rounded-[28px] bg-white/80 p-6 shadow-sm ring-1 ring-purple-100">
              <span className="block text-sm font-bold text-gray-700">빠른 입찰</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {quicks.map((value) => {
                  const active = Number(bidInput) === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBidInput(String(value))}
                      className={[
                        "h-11 rounded-xl border text-sm font-bold tabular-nums transition",
                        active
                          ? "border-violet-700 bg-violet-700 text-white"
                          : "border-purple-100 bg-white text-violet-800 hover:bg-purple-50",
                      ].join(" ")}
                    >
                      {formatKRW(value)}원
                    </button>
                  );
                })}
              </div>

              <AiBidRecommendation
                recommendation={aiBidRecommendation}
                loading={aiBidLoading}
                error={aiBidError}
                disabled={submitting || ended}
                stale={isAiRecommendationStale}
                staleReason={aiRecommendationStaleReason}
                currentPrice={currentPrice}
                nextMinimumBidPrice={nextMin}
                onRequest={requestAiBidRecommendation}
                onApply={applyAiBidRecommendation}
              />

              <span className="mt-5 block text-sm font-bold text-gray-700">직접 입력</span>
              <div className="relative mt-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={bidInput}
                  min={nextMin}
                  max={999_999_999}
                  step={bidUnit || 1}
                  onChange={(e) => setBidInput(e.target.value)}
                  className="h-14 w-full rounded-xl border border-purple-100 bg-white pl-4 pr-12 text-xl font-extrabold tabular-nums tracking-tight text-gray-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-300"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                  원
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                최소 <b className="font-extrabold text-violet-700 tabular-nums">{formatKRW(nextMin)}원</b>부터
              </p>

              <Button
                className="mt-4 w-full"
                size="lg"
                disabled={submitting}
                onClick={place}
              >
                {submitting ? "입찰 처리 중..." : `${formatKRW(bidInput || nextMin)}원 입찰`}
              </Button>
              <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-400">
                낙찰 후 48시간 안에 결제해 주세요.
              </p>
            </div>
          )}

          {isSeller && (
            <div className="rounded-[28px] bg-white/80 p-6 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-purple-100">
              본인이 등록한 경매에는 입찰할 수 없어요.
            </div>
          )}

          {ended && (
            <div className="rounded-[28px] bg-white/80 p-6 text-sm font-medium text-gray-500 shadow-sm ring-1 ring-purple-100">
              경매가 종료됐어요. 낙찰자에게 안내가 발송됩니다.
            </div>
          )}
        </aside>
      </div>

      {toast && (
        <div
          className={[
            "fixed left-1/2 top-20 z-[200] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg",
            toast.type === "error" ? "bg-red-600" : "bg-gray-900",
          ].join(" ")}
        >
          {toast.message}
        </div>
      )}
    </PageContainer>
  );
}
