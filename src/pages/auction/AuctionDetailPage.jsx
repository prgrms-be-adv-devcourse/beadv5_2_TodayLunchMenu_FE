import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import AiBidRecommendation from "../../components/auction/AiBidRecommendation";
import BigCountdown from "../../components/auction/BigCountdown";
import { recommendAuctionBidPriceApi } from "../../features/auction/auctionAiApi";
import { useAuth } from "../../features/auth/useAuth";
import { formatKRW, statusLabel } from "../../features/auction/format";
import { getMemberByIdApi } from "../../features/member/memberApi";
import { getProductDetailApi } from "../../features/product/productApi";
import { getOrdersApi } from "../../features/order/orderApi";
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
    if (value === prev.current) return undefined;

    const from = prev.current;
    const to = value;
    const duration = 420;
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    prev.current = value;
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return display;
}

function relativeTime(timestamp) {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  if (diff < 1000) return "방금";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return `${Math.floor(diff / 1000)}초 전`;
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return new Date(timestamp).toLocaleString("ko-KR");
}

function BidRow({ bid, isTop, isYou, bidderName }) {
  const name = isYou
    ? "나"
    : bidderName || `${(bid.bidderId || "익명").toString().slice(0, 4)}***`;

  return (
    <li
      className={[
        "flex items-center gap-3 border-b border-gray-100 py-2.5 text-sm last:border-0",
        isTop ? "bg-blue-50" : "",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isYou ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600",
        ].join(" ")}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>

      <span
        className={[
          "flex-1 truncate",
          isYou ? "font-bold text-blue-700" : "text-gray-700",
        ].join(" ")}
      >
        {name}
        {isTop && (
          <span className="ml-2 text-[10px] font-semibold text-blue-600">
            최고가
          </span>
        )}
      </span>

      <span className="w-20 text-right text-xs text-gray-400">
        {relativeTime(bid.createdAt)}
      </span>

      <span
        className={[
          "w-28 text-right font-bold tabular-nums",
          isTop ? "text-blue-700" : "text-gray-900",
        ].join(" ")}
      >
        {formatKRW(bid.amount)}원
      </span>
    </li>
  );
}

function StatusBadge({ status, ended }) {
  if (ended || ["COMPLETED", "PENDING_PAYMENT", "FAILED"].includes(status)) {
    return (
      <span className="border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
        종료
      </span>
    );
  }
  if (status === "WAITING") {
    return (
      <span className="border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
        시작 전
      </span>
    );
  }
  return (
    <span className="border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
      진행 중
    </span>
  );
}

export default function AuctionDetailPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { auction, setAuction, loading, error, reload } = useAuction(auctionId);
  const { bids, prependBid } = useAuctionBids(auctionId, { size: 30 });
  const { ended } = useCountdown(auction?.endsAt);

  const myId = user?.memberId;

  const validBids = useMemo(
    () => bids.filter((bid) => SHOW_BID_STATUSES.has(bid.status)),
    [bids],
  );

  const [productImages, setProductImages] = useState([]);
  const [productDescription, setProductDescription] = useState(null);
  const [productName, setProductName] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bidInput, setBidInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [aiBidRecommendation, setAiBidRecommendation] = useState(null);
  const [aiBidError, setAiBidError] = useState("");
  const [aiBidLoading, setAiBidLoading] = useState(false);
  const [aiRecommendationContext, setAiRecommendationContext] = useState(null);

  const [bidderNameMap, setBidderNameMap] = useState({});

  useEffect(() => {
    if (!validBids.length) return;
    const unknownIds = [
      ...new Set(
        validBids
          .map((b) => b.bidderId)
          .filter((id) => id && !bidderNameMap[id] && myId && String(id) !== String(myId)),
      ),
    ];
    if (!unknownIds.length) return;

    Promise.all(
      unknownIds.map((id) =>
        getMemberByIdApi(id)
          .then((member) => [id, member?.nickname || member?.name || null])
          .catch(() => [id, null]),
      ),
    ).then((entries) => {
      setBidderNameMap((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
  }, [validBids]); // eslint-disable-line react-hooks/exhaustive-deps

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
          const sorted = [...(product.images ?? [])].sort(
            (a, b) => a.sortOrder - b.sortOrder,
          );
          const thumbIdx = sorted.findIndex((img) => img.isThumbnail);
          setProductImages(sorted);
          setSelectedImageIndex(thumbIdx >= 0 ? thumbIdx : 0);
          setProductDescription(product.description ?? null);
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
    if (!auction) return;
    if (bidInput === "" || Number(bidInput) < nextMin) {
      setBidInput(String(nextMin));
    }
  }, [auction?.currentPrice, auction?.bidUnit, nextMin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleBidEvent = useCallback(
    (payload) => {
      if (!payload?.auctionId || String(payload.auctionId) !== String(auctionId)) return;

      const bidPrice = Number(payload.bidPrice);
      const endAt = payload.endAt ? new Date(payload.endAt).getTime() : null;

      setAuction((prev) => {
        if (!prev) return prev;
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
    [auctionId, prependBid, setAuction],
  );

  const handleUserMessage = useCallback((message) => {
    setToast({ type: "error", message });
  }, []);

  useAuctionSocket(auctionId, handleBidEvent, myId, handleUserMessage);

  const quicks = useMemo(() => {
    if (!auction || bidUnit <= 0) return [];
    const base = nextMin;
    return [base, base + bidUnit * 2, base + bidUnit * 5, base + bidUnit * 10];
  }, [auction, bidUnit, nextMin]);

  const aiRecommendationStaleReason = useMemo(() => {
    if (!aiRecommendationContext) return "";
    if (aiRecommendationContext.currentPrice !== currentPrice)
      return "현재 최고가가 변경되어 추천 기준이 달라졌어요.";
    if (aiRecommendationContext.nextMinimumBidPrice !== nextMin)
      return "다음 최소 입찰가가 바뀌어 추천을 다시 계산하는 것이 좋아요.";
    if (aiRecommendationContext.bidCount !== bids.length)
      return "입찰 수가 늘어나 경매 흐름이 달라졌어요.";
    return "";
  }, [aiRecommendationContext, bids.length, currentPrice, nextMin]);

  const isAiRecommendationStale = Boolean(aiRecommendationStaleReason);

  const requestAiBidRecommendation = async () => {
    if (!auction) return;
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
      const recommendedBidPrice = Math.max(recommendation.recommendedBidPrice, nextMin);
      const expectedFinalPrice = Math.max(recommendation.expectedFinalPrice, recommendedBidPrice);
      setAiBidRecommendation({ ...recommendation, recommendedBidPrice, expectedFinalPrice });
      setAiRecommendationContext({ currentPrice, nextMinimumBidPrice: nextMin, bidCount: bids.length });
    } catch (nextError) {
      setAiBidRecommendation(null);
      setAiRecommendationContext(null);
      setAiBidError(nextError?.message || "AI 추천 입찰가를 불러오지 못했습니다.");
    } finally {
      setAiBidLoading(false);
    }
  };

  const applyAiBidRecommendation = () => {
    if (!aiBidRecommendation?.recommendedBidPrice) return;
    setBidInput(String(aiBidRecommendation.recommendedBidPrice));
    setToast({ type: "success", message: "AI 추천가를 입력했습니다." });
  };

  const handleAuctionCheckout = async () => {
    try {
      const page = await getOrdersApi({});
      const pendingOrder = page.content.find(
        (o) => o.orderType === "AUCTION" && o.status === "CREATED"
      );
      if (pendingOrder) {
        navigate("/orders/checkout", {
          state: {
            isAuction: true,
            orderId: pendingOrder.orderId,
            items: [{
              name: pendingOrder.representativeProductName,
              quantity: 1,
              price: pendingOrder.totalAmount,
              image: pendingOrder.representativeThumbnailKey,
            }],
          },
        });
      } else {
        navigate("/orders");
      }
    } catch {
      navigate("/orders");
    }
  };

  const place = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
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
    if (bidUnit > 0 && amount % bidUnit !== 0) {
      setToast({ type: "error", message: `입찰가는 ${formatKRW(bidUnit)}원 단위로 입력해 주세요.` });
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
      if (nextError?.status === 401) { navigate("/login"); return; }
      setToast({ type: "error", message: nextError?.message || "입찰에 실패했습니다." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        경매 정보를 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center text-red-600">
        {error.message || "경매 정보를 불러오지 못했습니다."}
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="py-16 text-center text-gray-500">경매를 찾을 수 없습니다.</div>
    );
  }

  const isSeller = myId && auction.sellerId && myId === auction.sellerId;
  const isWaiting = auction.status === "WAITING";
  const topBid = bids[0];
  const isHighestBidder =
    !ended &&
    auction.hasBid &&
    validBids[0] &&
    myId &&
    String(validBids[0].bidderId) === String(myId);

  return (
    <div className="py-2">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-gray-500">
        <Link to="/auctions" className="hover:text-blue-600 hover:underline">
          경매장
        </Link>
        <span className="text-gray-300">›</span>
        <span className="max-w-xs truncate font-medium text-gray-800">
          {auction.productTitle ?? productName ?? "경매 상품"}
        </span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Main Image */}
          <div className="relative aspect-[4/3] overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={productImages[selectedImageIndex]?.url || "/default-product.svg"}
              alt={auction.productTitle || "경매 상품"}
              className="h-full w-full object-cover"
            />

            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex(
                      (i) => (i - 1 + productImages.length) % productImages.length,
                    )
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-white/90 text-xl text-gray-700 shadow transition hover:bg-white"
                  aria-label="이전 이미지"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex((i) => (i + 1) % productImages.length)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-white/90 text-xl text-gray-700 shadow transition hover:bg-white"
                  aria-label="다음 이미지"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {productImages.map((img, idx) => (
                <button
                  key={img.id ?? idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={[
                    "h-14 w-14 shrink-0 overflow-hidden border-2 transition",
                    idx === selectedImageIndex
                      ? "border-blue-600"
                      : "border-gray-200 opacity-60 hover:opacity-90",
                  ].join(" ")}
                >
                  <img
                    src={img.url || "/default-product.svg"}
                    alt={`이미지 ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Item Details */}
          <div className="mt-5 border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-bold text-gray-700">상품 정보</h2>
            </div>
            <dl className="grid grid-cols-3 divide-x divide-gray-100 px-0">
              {[
                { label: "시작가", value: `${formatKRW(auction.startPrice)}원` },
                { label: "입찰 단위", value: `${formatKRW(auction.bidUnit)}원` },
                { label: "총 입찰", value: `${validBids.length}회` },
              ].map(({ label, value }) => (
                <div key={label} className="px-5 py-3">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="mt-0.5 font-bold text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Description */}
          {productDescription && (
            <div className="mt-4 border border-gray-200 bg-white">
              <div className="border-b border-gray-200 px-5 py-3">
                <h2 className="text-sm font-bold text-gray-700">상품 설명</h2>
              </div>
              <div className="px-5 py-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {productDescription}
                </p>
              </div>
            </div>
          )}

          {/* Bid History */}
          <div className="mt-4 border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h2 className="text-sm font-bold text-gray-700">입찰 내역</h2>
              <span className="text-xs text-gray-400">{validBids.length}건</span>
            </div>

            {validBids.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                아직 입찰이 없습니다.
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto px-4">
                {validBids.map((bid, index) => (
                  <BidRow
                    key={bid.id}
                    bid={bid}
                    isTop={index === 0}
                    isYou={myId && bid.bidderId === myId}
                    bidderName={bid.bidderName || bidderNameMap[bid.bidderId] || null}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
          {/* Title & Status */}
          <div className="border border-gray-200 bg-white px-5 py-4">
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge status={auction.status} ended={ended} />
              <span className="text-xs text-gray-400">{statusLabel(auction.status)}</span>
            </div>
            <h1 className="text-lg font-bold leading-snug text-gray-900">
              {auction.productTitle ?? productName ?? "경매 상품"}
            </h1>
          </div>

          {/* Current Price & Countdown */}
          <div className="border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs text-gray-500">
              {ended ? "낙찰가" : "현재 입찰가"}
            </p>
            <p className="mt-1 tabular-nums text-3xl font-bold text-gray-900">
              {formatKRW(animatedPrice)}
              <span className="ml-1 text-lg font-medium text-gray-600">원</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {auction.hasBid
                ? `최고 입찰 · ${topBid ? relativeTime(topBid.createdAt) : ""}`
                : "첫 입찰을 기다리고 있습니다"}
            </p>

            {!ended && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs text-gray-500">남은 시간</p>
                <BigCountdown endsAt={auction.endsAt} />
              </div>
            )}
          </div>

          {/* Waiting State */}
          {isWaiting && (
            <div className="border border-blue-200 bg-blue-50 px-5 py-4">
              <p className="text-sm font-semibold text-blue-800">
                경매가 아직 시작되지 않았습니다.
              </p>
              {auction.startedAt && (
                <p className="mt-1 text-sm text-blue-700">
                  시작 예정:{" "}
                  {new Date(auction.startedAt).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          )}

          {/* Highest Bidder Notice */}
          {!ended && !isSeller && !isWaiting && isHighestBidder && (
            <div className="border border-green-200 bg-green-50 px-5 py-4">
              <p className="text-sm font-bold text-green-800">
                현재 최고 입찰자입니다
              </p>
              <p className="mt-1 text-xs leading-relaxed text-green-700">
                내가 최고가인 동안에는 재입찰할 수 없어요. 다른 입찰자가 더 높은
                금액을 제시하면 다시 입찰할 수 있습니다.
              </p>
            </div>
          )}

          {/* Bid Panel */}
          {!ended && !isSeller && !isWaiting && !isHighestBidder && (
            <div className="border border-gray-200 bg-white px-5 py-4">
              {/* Quick Bids */}
              <p className="mb-2 text-xs font-semibold text-gray-600">빠른 입찰</p>
              <div className="grid grid-cols-2 gap-2">
                {quicks.map((value) => {
                  const active = Number(bidInput) === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBidInput(String(value))}
                      className={[
                        "h-10 border text-sm font-semibold tabular-nums transition",
                        active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600",
                      ].join(" ")}
                    >
                      {formatKRW(value)}원
                    </button>
                  );
                })}
              </div>

              {/* AI Recommendation */}
              <div className="mt-4">
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
              </div>

              {/* Direct Input */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-gray-600">직접 입력</p>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={bidInput}
                    min={nextMin}
                    max={999_999_999}
                    step={bidUnit || 1}
                    onChange={(e) => setBidInput(e.target.value)}
                    className="h-11 w-full border border-gray-300 pl-3 pr-10 text-base font-bold tabular-nums text-gray-900 outline-none transition focus:border-blue-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    원
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  최소{" "}
                  <span className="font-semibold text-gray-700">
                    {formatKRW(nextMin)}원
                  </span>
                  부터 입찰 가능
                </p>
              </div>

              {/* Bid Button */}
              <button
                type="button"
                disabled={submitting}
                onClick={place}
                className="mt-4 h-12 w-full bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "입찰 처리 중..."
                  : `${formatKRW(Number(bidInput) || nextMin)}원 입찰하기`}
              </button>

              <p className="mt-2 text-center text-xs text-gray-400">
                낙찰 후 48시간 안에 결제해 주세요.
              </p>
            </div>
          )}

          {/* Seller Notice */}
          {isSeller && (
            <div className="border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500">
              본인이 등록한 경매에는 입찰할 수 없어요.
            </div>
          )}

          {/* Payment Required */}
          {ended &&
            auction.status === "PENDING_PAYMENT" &&
            myId &&
            topBid?.bidderId === myId && (
              <div className="border border-amber-300 bg-amber-50 px-5 py-4">
                <p className="text-sm font-bold text-amber-800">
                  낙찰을 축하합니다!
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  <span className="font-bold tabular-nums">
                    {formatKRW(currentPrice)}원
                  </span>
                  에 낙찰되었어요. 48시간 안에 결제를 완료해 주세요.
                </p>
                <button
                  type="button"
                  onClick={handleAuctionCheckout}
                  className="mt-4 h-11 w-full bg-amber-500 text-sm font-bold text-white transition hover:bg-amber-600"
                >
                  주문하기
                </button>
              </div>
            )}

          {/* Ended (not payment pending) */}
          {ended && auction.status !== "PENDING_PAYMENT" && (
            <div className="border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500">
              경매가 종료됐어요. 낙찰자에게 안내가 발송됩니다.
            </div>
          )}
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={[
            "fixed left-1/2 top-20 z-[200] -translate-x-1/2 px-5 py-3 text-sm font-semibold text-white shadow-lg",
            toast.type === "error" ? "bg-red-600" : "bg-gray-900",
          ].join(" ")}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
