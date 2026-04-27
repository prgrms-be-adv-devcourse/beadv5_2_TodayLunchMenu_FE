import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import ToastViewport from "../../components/common/ToastViewport";
import SellerNav from "../../components/seller/SellerNav";
import { useAuth } from "../../features/auth/useAuth";
import {
  getSellerRefundPendingListApi,
  confirmSellerRefundApi,
} from "../../features/seller/sellerRefundApi";

const REFUND_STATUS = {
  PENDING: "대기중",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
  CONFIRMED: "환불확인",
  REFUNDED: "환불완료",
};

function formatKRW(value) {
  return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getErrorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback;
}

function RefundCard({ refund, onConfirmClick }) {
  const totalPrice = refund.items?.reduce(
    (sum, item) => sum + (item.price * item.quantity || 0),
    0
  );

  return (
    <div className="bg-white border border-gray-200 p-6 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">
            주문번호: <span className="font-semibold">{refund.orderId}</span>
          </p>
          <p className="text-sm text-gray-600">
            구매자: <span className="font-semibold">{refund.buyerName}</span>
          </p>
        </div>
        <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full">
          {REFUND_STATUS[refund.status] || refund.status}
        </span>
      </div>

      {/* Items */}
      <div className="bg-gray-50 p-4 mb-4">
        <h4 className="font-semibold text-sm mb-3">반품 상품</h4>
        <div className="space-y-2">
          {refund.items && refund.items.length > 0 ? (
            refund.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.productName} x {item.quantity}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatKRW(item.price * item.quantity)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">상품 정보 없음</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 pt-4 mb-4">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-900">환불 예정액</span>
          <span className="text-lg font-bold text-blue-600">
            {formatKRW(totalPrice)}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
        <p className="mb-2">
          <span className="font-semibold">반품 신청일:</span> {formatDate(refund.createdAt)}
        </p>
        {refund.reason && (
          <p>
            <span className="font-semibold">사유:</span> {refund.reason}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {refund.status === "DELIVERED" || refund.status === "PENDING" ? (
        <Button
          onClick={() => onConfirmClick(refund)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 transition-colors"
        >
          환불 수령 완료
        </Button>
      ) : (
        <Button
          disabled
          className="w-full bg-gray-300 text-gray-600 font-semibold py-2 cursor-not-allowed"
        >
          {refund.status === "REFUNDED" ? "환불 완료" : "처리 중"}
        </Button>
      )}
    </div>
  );
}

export default function SellerRefundManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // 권한 확인
  if (!authLoading && (!user || user.role !== "SELLER")) {
    return <Navigate to="/" />;
  }

  // 환불 목록 조회
  const fetchRefundList = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getSellerRefundPendingListApi(user.id);

      // API 응답 형식에 맞게 처리
      if (Array.isArray(data)) {
        setRefunds(data);
      } else if (data.content) {
        // Paginated response
        setRefunds(data.content || []);
      } else if (data.data) {
        // Wrapped response
        setRefunds(Array.isArray(data.data) ? data.data : []);
      } else {
        setRefunds([]);
      }
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
      setError(getErrorMessage(err, "환불 목록을 불러올 수 없습니다."));
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRefundList();
  }, [fetchRefundList]);

  // 환불 확인 버튼 클릭
  const handleConfirmRefund = (refund) => {
    setSelectedRefund(refund);
    setIsConfirmModalOpen(true);
  };

  // 환불 확인 처리
  const handleConfirmRefundSubmit = async () => {
    if (!selectedRefund) return;

    try {
      setConfirmingRefund(true);

      // API Request 형식: SellerRefundConfirmRequest
      const refundRequest = {
        orderId: selectedRefund.orderId,
        orderCancelRequestId: selectedRefund.orderCancelRequestId,
        refundType: selectedRefund.refundType || "PARTIAL", // FULL | PARTIAL
        reason: "판매자가 반품 수령 완료",
        items: selectedRefund.items || [],
      };

      await confirmSellerRefundApi(refundRequest);

      // 성공
      setToastMessage("환불 수령이 완료되었습니다.");
      setToastType("success");
      setIsConfirmModalOpen(false);
      setSelectedRefund(null);

      // 목록 새로고침
      await fetchRefundList();
    } catch (err) {
      console.error("Failed to confirm refund:", err);
      const errorMsg = getErrorMessage(err, "환불 수령 처리에 실패했습니다.");
      setToastMessage(errorMsg);
      setToastType("error");
    } finally {
      setConfirmingRefund(false);
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedRefund(null);
  };

  // Empty state
  if (!loading && refunds.length === 0) {
    return (
      <>
        <SellerNav currentPage="refunds" />
        <PageContainer>
          <div className="mb-6"><h1 className="text-xl font-black text-gray-900">환불 관리</h1></div>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">
                처리할 환불이 없습니다.
              </p>
              <p className="text-gray-400 text-sm">
                고객이 반품을 신청하면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <SellerNav currentPage="refunds" />
      <PageContainer>
        <div className="mb-6"><h1 className="text-xl font-black text-gray-900">환불 관리</h1></div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 mb-6 text-red-700">
            <p className="font-semibold mb-1">오류</p>
            <p className="text-sm">{error}</p>
            <Button
              onClick={fetchRefundList}
              className="mt-3 text-red-700 hover:text-red-900 underline text-sm"
            >
              다시 시도
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Refund List */}
        {!loading && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              <p>
                총{" "}
                <span className="font-semibold text-gray-900">{refunds.length}</span>
                건의 환불 대기 건이 있습니다.
              </p>
            </div>

            <div className="space-y-4">
              {refunds.map((refund) => (
                <RefundCard
                  key={`${refund.orderId}-${refund.orderCancelRequestId}`}
                  refund={refund}
                  onConfirmClick={handleConfirmRefund}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {isConfirmModalOpen && selectedRefund && (
          <ConfirmModal
            title="환불 수령 확인"
            message={`주문 ${selectedRefund.orderId}의 반품 수령을 완료하시겠습니까?\n환불이 시작됩니다.`}
            onConfirm={handleConfirmRefundSubmit}
            onCancel={handleCloseConfirmModal}
            isLoading={confirmingRefund}
            confirmText="확인"
            cancelText="취소"
          />
        )}

        {/* Toast */}
        {toastMessage && (
          <ToastViewport
            message={toastMessage}
            type={toastType}
            onClose={() => setToastMessage(null)}
          />
        )}
      </PageContainer>
    </>
  );
}
