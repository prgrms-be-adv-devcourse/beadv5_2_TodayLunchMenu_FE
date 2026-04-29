import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../api/client";
import SellerNav from "../../components/seller/SellerNav";
import {
  getSellerDeliveriesApi,
  getSellerDeliveryCountsApi,
  shipDeliveryApi,
} from "../../features/seller/sellerDeliveryApi";

const COURIERS = [
  "CJ대한통운", "롯데택배", "한진택배", "우체국택배", "로젠택배",
];

const STATUS_META = {
  PREPARING: { label: "배송 준비", className: "bg-red-100 text-red-600" },
  SHIPPED:   { label: "배송 중",   className: "bg-amber-100 text-amber-600" },
  DELIVERED: { label: "배송 완료", className: "bg-emerald-100 text-emerald-700" },
};

const STATUS_OPTIONS = [
  { value: "ALL",       label: "전체 상태" },
  { value: "PREPARING", label: "배송 준비" },
  { value: "SHIPPED",   label: "배송 중" },
  { value: "DELIVERED", label: "배송 완료" },
];

function formatDateFull(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" });
}

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="w-20 flex-shrink-0 text-xs text-gray-400">{label}</span>
      <span className="text-xs text-gray-800">{value}</span>
    </div>
  );
}

export default function SellerDeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [counts, setCounts] = useState({ preparing: 0, shipped: 0, delivered: 0 });

  const [orderNumberQ, setOrderNumberQ] = useState("");
  const [receiverQ, setReceiverQ] = useState("");
  const [productQ, setProductQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [courierFilter, setCourierFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const debouncedOrderNumber = useDebounce(orderNumberQ);
  const debouncedReceiver = useDebounce(receiverQ);
  const debouncedProduct = useDebounce(productQ);

  const [detailModal, setDetailModal] = useState(null);
  const [shipModal, setShipModal] = useState(null);
  const [courier, setCourier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [shipLoading, setShipLoading] = useState(false);
  const [shipError, setShipError] = useState("");

  // 상태별 카운트 — 최초 1회만 로드
  useEffect(() => {
    getSellerDeliveryCountsApi()
      .then(setCounts)
      .catch(() => {});
  }, []);

  // 필터 변경 시 page 초기화
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPage(0);
  }, [debouncedOrderNumber, debouncedReceiver, debouncedProduct, statusFilter, courierFilter, dateFrom, dateTo]);

  // 목록 로드
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getSellerDeliveriesApi({
          status: statusFilter,
          orderNumber: debouncedOrderNumber,
          receiver: debouncedReceiver,
          productName: debouncedProduct,
          courierName: courierFilter,
          dateFrom,
          dateTo,
          page,
        });
        if (!cancelled) {
          setDeliveries(result.content);
          setTotalPages(result.totalPages);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "배송 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [debouncedOrderNumber, debouncedReceiver, debouncedProduct, statusFilter, courierFilter, dateFrom, dateTo, page]);

  async function handleShip() {
    if (!courier) { setShipError("택배사를 선택해주세요."); return; }
    if (!invoiceNumber.trim()) { setShipError("송장번호를 입력해주세요."); return; }
    try {
      setShipLoading(true);
      setShipError("");
      const shipped = await shipDeliveryApi(shipModal.deliveryId, { courier, invoiceNumber: invoiceNumber.trim() });
      setDeliveries((prev) => prev.map((d) =>
        d.deliveryId === shipModal.deliveryId
          ? { ...d, status: "SHIPPED", courierName: courier, courierCode: shipped?.courierCode ?? d.courierCode, invoiceNumber: invoiceNumber.trim(), shippedAt: new Date().toISOString() }
          : d
      ));
      setCounts((prev) => ({ ...prev, preparing: prev.preparing - 1, shipped: prev.shipped + 1 }));
      setShipModal(null);
    } catch (err) {
      setShipError(err instanceof ApiError ? err.message : "배송 처리에 실패했습니다.");
    } finally {
      setShipLoading(false);
    }
  }

  function openShipModal(delivery) {
    setShipModal({ deliveryId: delivery.deliveryId, productName: delivery.productName, receiver: delivery.receiver });
    setCourier("");
    setInvoiceNumber("");
    setShipError("");
  }

  function resetFilters() {
    setOrderNumberQ(""); setReceiverQ(""); setProductQ("");
    setStatusFilter("ALL"); setCourierFilter("ALL");
    setDateFrom(""); setDateTo("");
    setPage(0);
  }

  return (
    <>
      <SellerNav currentPage="delivery" />
      <div className="py-8">
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Seller Delivery</p>
          <h1 className="mt-1 text-2xl font-black text-gray-900">배송 관리</h1>
        </div>

        {/* 요약 카드 */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { key: "preparing", status: "PREPARING", label: "배송 준비", color: "text-red-600",     bg: "bg-red-50 ring-red-100" },
            { key: "shipped",   status: "SHIPPED",   label: "배송 중",   color: "text-amber-600",   bg: "bg-amber-50 ring-amber-100" },
            { key: "delivered", status: "DELIVERED", label: "배송 완료", color: "text-emerald-600", bg: "bg-emerald-50 ring-emerald-100" },
          ].map((item) => (
            <button
              key={item.status}
              type="button"
              onClick={() => { setStatusFilter(statusFilter === item.status ? "ALL" : item.status); setPage(0); }}
              className={`rounded-2xl p-8 text-left shadow-sm ring-1 transition hover:opacity-80 ${item.bg} ${statusFilter === item.status ? "ring-2" : ""}`}
            >
              <p className="text-sm font-semibold text-gray-500">{item.label}</p>
              <p className={`mt-3 text-5xl font-black ${item.color}`}>
                {counts[item.key]}<span className="text-2xl">건</span>
              </p>
            </button>
          ))}
        </div>

        {/* 필터 */}
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <input type="text" placeholder="주문번호 검색" value={orderNumberQ} onChange={(e) => setOrderNumberQ(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300" />
            <input type="text" placeholder="수령인 검색" value={receiverQ} onChange={(e) => setReceiverQ(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300" />
            <input type="text" placeholder="상품명 검색" value={productQ} onChange={(e) => setProductQ(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300">
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={courierFilter} onChange={(e) => { setCourierFilter(e.target.value); setPage(0); }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-300">
              <option value="ALL">전체 택배사</option>
              {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-violet-300" />
              <span className="text-xs text-gray-300">~</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <button type="button" onClick={resetFilters}
              className="flex-shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-400 transition hover:bg-gray-50 hover:text-gray-600">
              초기화
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 px-6 py-10 text-center">
            <p className="text-sm font-bold text-red-600">{error}</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-14 text-center shadow-sm ring-1 ring-gray-100">
            <p className="text-sm text-gray-500">해당 조건의 배송 건이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
              <table className="w-full table-fixed text-sm">
                <colgroup>
                  <col style={{ width: "130px" }} />
                  <col style={{ width: "185px" }} />
                  <col style={{ width: "50px" }} />
                  <col style={{ width: "165px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "85px" }} />
                  <col style={{ width: "115px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3 text-center">주문번호</th>
                    <th className="px-4 py-3 text-center">상품명</th>
                    <th className="px-4 py-3 text-center">수량</th>
                    <th className="px-4 py-3 text-center">고객</th>
                    <th className="px-4 py-3 text-center">배송지</th>
                    <th className="px-4 py-3 text-center">택배사 / 송장</th>
                    <th className="px-4 py-3 text-center">상태</th>
                    <th className="px-4 py-3 text-center">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {deliveries.map((d) => {
                    const meta = STATUS_META[d.status] ?? { label: d.status, className: "bg-gray-100 text-gray-600" };
                    return (
                      <tr
                        key={d.deliveryId}
                        className="h-16 cursor-pointer transition hover:bg-violet-50/50"
                        onClick={() => setDetailModal(d)}
                      >
                        <td className="px-4 py-3 align-middle">
                          <p className="font-mono text-xs font-semibold text-gray-800 leading-relaxed">
                            {(d.orderNumber || d.orderId || "").replace(/-/g, "​-")}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle max-w-[180px]">
                          <p className="truncate font-semibold text-gray-900" title={d.productName}>{d.productName}</p>
                        </td>
                        <td className="px-4 py-3 align-middle text-center text-gray-700">{d.quantity}</td>
                        <td className="px-4 py-3 align-middle">
                          <p className="truncate font-semibold text-gray-900">{d.receiver || "-"}</p>
                          <p className="whitespace-nowrap text-xs text-gray-400">{d.receiverPhone || ""}</p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="truncate text-xs text-gray-600">
                            {[d.address, d.addressDetail].filter(Boolean).join(" ") || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {d.courierName ? (
                            <>
                              <p className="text-xs font-semibold text-gray-700">{d.courierName}</p>
                              <p className="font-mono text-xs text-gray-400">{d.invoiceNumber}</p>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300">미입력</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-middle text-center">
                          <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.className}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-middle text-center">
                          {d.status === "PREPARING" && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openShipModal(d); }}
                              className="whitespace-nowrap rounded-full bg-blue-400 px-3 py-1 text-xs font-bold text-white transition hover:bg-blue-500"
                            >
                              송장 입력
                            </button>
                          )}
                          {d.status === "SHIPPED" && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); window.open(`https://tracker.delivery/#/${d.courierCode}/${d.invoiceNumber}`, "_blank"); }}
                              className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
                            >
                              배송 조회
                            </button>
                          )}
                          {d.status === "DELIVERED" && (
                            <div className="text-xs text-gray-400">
                              <p>{d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString("ko-KR", { dateStyle: "short" }) : "-"}</p>
                              <p>{d.deliveredAt ? new Date(d.deliveredAt).toLocaleTimeString("ko-KR", { timeStyle: "short" }) : ""}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 disabled:opacity-30 hover:bg-gray-50"
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i).map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      i === page
                        ? "bg-violet-600 text-white"
                        : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 disabled:opacity-30 hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 상세 모달 */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setDetailModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-gray-400">{detailModal.orderNumber || detailModal.orderId}</p>
                <h2 className="mt-0.5 text-base font-black text-gray-900 leading-snug">{detailModal.productName}</h2>
              </div>
              <button type="button" onClick={() => setDetailModal(null)} className="ml-4 text-gray-300 hover:text-gray-500 text-xl leading-none">✕</button>
            </div>
            <div className="space-y-2 rounded-xl bg-gray-50 p-4">
              <DetailRow label="수령인" value={detailModal.receiver} />
              <DetailRow label="연락처" value={detailModal.receiverPhone} />
              <DetailRow label="주소" value={[detailModal.address, detailModal.addressDetail].filter(Boolean).join(" ")} />
              <DetailRow label="우편번호" value={detailModal.zipCode} />
            </div>
            <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-4">
              <DetailRow label="수량" value={`${detailModal.quantity}개`} />
              <DetailRow label="택배사" value={detailModal.courierName} />
              <DetailRow label="송장번호" value={detailModal.invoiceNumber} />
              <DetailRow label="발송일" value={detailModal.shippedAt ? formatDateFull(detailModal.shippedAt) : null} />
              <DetailRow label="배송완료일" value={detailModal.deliveredAt ? formatDateFull(detailModal.deliveredAt) : null} />
            </div>
            <div className="mt-4 flex gap-2">
              {detailModal.status === "PREPARING" && (
                <button type="button"
                  onClick={() => { setDetailModal(null); openShipModal(detailModal); }}
                  className="flex-1 rounded-lg bg-blue-400 py-2.5 text-sm font-bold text-white hover:bg-blue-500">
                  송장 입력
                </button>
              )}
              {detailModal.status === "SHIPPED" && (
                <button type="button"
                  onClick={() => window.open(`https://tracker.delivery/#/${detailModal.courierCode}/${detailModal.invoiceNumber}`, "_blank")}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
                  배송 조회
                </button>
              )}
              <button type="button" onClick={() => setDetailModal(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 송장 입력 모달 */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-black text-gray-900">송장 입력</h2>
            <p className="mb-1 truncate text-sm font-semibold text-gray-700">{shipModal.productName}</p>
            <p className="mb-5 text-xs text-gray-400">수령인: {shipModal.receiver || "-"}</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500">택배사 선택</label>
                <select value={courier} onChange={(e) => setCourier(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-300">
                  <option value="">택배사 선택</option>
                  {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500">송장번호</label>
                <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="송장번호 입력"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-300" />
              </div>
            </div>
            {shipError && <p className="mt-3 text-sm font-medium text-red-500">{shipError}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setShipModal(null)}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
                취소
              </button>
              <button type="button" onClick={handleShip} disabled={shipLoading}
                className="flex-1 rounded-lg bg-blue-500 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">
                {shipLoading ? "처리 중..." : "송장 등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
