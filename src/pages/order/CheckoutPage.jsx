import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";

const FORM_STORAGE_KEY = "checkout-form-state";

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuction = location.state?.isAuction === true;
  const auctionOrderId = location.state?.orderId ?? null;
  const checkoutItems = Array.isArray(location.state?.items)
    ? location.state.items
    : [];
  const hasCheckoutItems = checkoutItems.length > 0;

  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) return JSON.parse(saved).form ?? {};
    } catch {}
    return { receiver: "", receiverPhone: "", address: "", addressDetail: "", zipCode: "", memo: "" };
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) return JSON.parse(saved).paymentMethod ?? "DEPOSIT";
    } catch {}
    return "DEPOSIT";
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({ form, paymentMethod: selectedPaymentMethod }));
    } catch {}
  }, [form, selectedPaymentMethod]);

  const isDepositPayment = selectedPaymentMethod === "DEPOSIT";
  const paymentMethodLabel = isDepositPayment ? "예치금 결제" : "카드 결제";

  const summary = useMemo(() => {
    const subtotal = checkoutItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingFee = subtotal >= 30000 || subtotal === 0 ? 0 : 3000;
    const total = subtotal + shippingFee;

    return {
      subtotal,
      shippingFee,
      total,
    };
  }, [checkoutItems]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.receiver.trim()) nextErrors.receiver = "수령인을 입력해 주세요.";
    if (!form.receiverPhone.trim()) {
      nextErrors.receiverPhone = "연락처를 입력해 주세요.";
    }
    if (!form.address.trim()) nextErrors.address = "주소를 입력해 주세요.";
    if (!form.addressDetail.trim()) {
      nextErrors.addressDetail = "상세 주소를 입력해 주세요.";
    }
    if (!form.zipCode.trim()) nextErrors.zipCode = "우편번호를 입력해 주세요.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleOpenConfirm = () => {
    if (!hasCheckoutItems) {
      setSubmitError(
        "주문할 상품이 없습니다. 장바구니에서 상품을 선택해 주세요."
      );
      return;
    }

    if (!validate()) {
      return;
    }

    setOpenConfirmModal(true);
  };

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError("");

      if (!hasCheckoutItems) {
        setSubmitError(
          "주문할 상품이 없습니다. 장바구니에서 상품을 선택해 주세요."
        );
        return;
      }

      const shippingInfo = {
        address: form.address.trim(),
        addressDetail: form.addressDetail.trim(),
        zipCode: form.zipCode.trim(),
        receiver: form.receiver.trim(),
        receiverPhone: form.receiverPhone.trim(),
      };

      setOpenConfirmModal(false);

      sessionStorage.removeItem(FORM_STORAGE_KEY);
      sessionStorage.removeItem("payment-completed");

      if (isAuction) {
        navigate("/payments", {
          replace: true,
          state: {
            isAuction: true,
            auctionOrderId,
            orderId: auctionOrderId,
            status: "CREATED",
            createdAt: new Date().toISOString(),
            shipping: shippingInfo,
            memo: form.memo.trim(),
            items: checkoutItems.map((item) => ({
              cartId: item.cartId,
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image,
              category: item.category,
            })),
            itemPrice: summary.subtotal,
            shippingFee: summary.shippingFee,
            totalPrice: summary.total,
            paymentMethod: paymentMethodLabel,
            paymentMethodCode: selectedPaymentMethod,
            depositLabel: "Deposit / Vivid Pay",
            selectedPaymentMethod,
          },
        });
        return;
      }

      const paymentState = {
        orderId: null,
        status: "CREATED",
        createdAt: new Date().toISOString(),
        ...shippingInfo,
        memo: form.memo.trim(),
        shipping: shippingInfo,
        items: checkoutItems.map((item) => ({
          cartId: item.cartId,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          category: item.category,
        })),
        itemPrice: summary.subtotal,
        shippingFee: summary.shippingFee,
        totalPrice: summary.total,
        paymentMethod: paymentMethodLabel,
        paymentMethodCode: selectedPaymentMethod,
        depositLabel: "Deposit / Vivid Pay",
        selectedPaymentMethod,
        pendingOrder: true,
      };

      navigate("/payments", { replace: true, state: paymentState });
    } catch {
      setSubmitError("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageContainer>
        <div className="text-left">
        {!hasCheckoutItems ? (
          <section className="mb-6 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            주문할 상품 정보가 없습니다. 장바구니에서 상품을 선택한 뒤 다시
            진행해 주세요.
          </section>
        ) : null}

        {submitError ? (
          <section className="mb-6 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {submitError}
          </section>
        ) : null}

        <PageHeader title="주문서" />

        <section className="mb-6 bg-blue-700 p-5 text-white shadow-xl">
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 px-3 py-3">
              <p className="text-xs font-bold text-blue-200">STEP 1</p>
              <p className="mt-1 text-sm font-extrabold">장바구니</p>
            </div>
            <div className="bg-white px-3 py-3 text-blue-700">
              <p className="text-xs font-bold">STEP 2</p>
              <p className="mt-1 text-sm font-extrabold">주문서</p>
            </div>
            <div className="bg-white/10 px-3 py-3">
              <p className="text-xs font-bold text-blue-200">STEP 3</p>
              <p className="mt-1 text-sm font-extrabold">결제</p>
            </div>
          </div>
        </section>

        <div className="space-y-7 pb-32">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>주문 상품</h2>
          <section className="bg-white/80 p-6 shadow-sm ring-1 ring-gray-200">
            <div className="space-y-4">
              {checkoutItems.map((item) => (
                <article
                  key={item.cartId || item.productId}
                  className="flex gap-4 bg-blue-50/60 p-4"
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden bg-blue-50">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-blue-700">
                        {(item.name || "P").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                        {item.category}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        수량 {item.quantity}개
                      </p>
                    </div>
                    <p className="text-lg font-extrabold text-blue-700">
                      {formatPrice(item.price * item.quantity)}원
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>배송 정보</h2>
          <section className="bg-white/80 p-6 shadow-sm ring-1 ring-gray-200">
            <div className="space-y-4">
              <FormField
                label="수령인"
                htmlFor="receiver"
                required
                error={errors.receiver}
              >
                <Input
                  id="receiver"
                  placeholder="홍길동"
                  value={form.receiver}
                  onChange={handleChange("receiver")}
                  error={!!errors.receiver}
                />
              </FormField>
              <FormField
                label="연락처"
                htmlFor="receiverPhone"
                required
                error={errors.receiverPhone}
              >
                <Input
                  id="receiverPhone"
                  placeholder="01012345678"
                  value={form.receiverPhone}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, "");
                    setForm((prev) => ({ ...prev, receiverPhone: onlyNums }));
                    setErrors((prev) => ({ ...prev, receiverPhone: "" }));
                    setSubmitError("");
                  }}
                  error={!!errors.receiverPhone}
                />
              </FormField>
              <FormField
                label="주소"
                htmlFor="address"
                required
                error={errors.address}
              >
                <Input
                  id="address"
                  placeholder="서울특별시 강남구 ..."
                  value={form.address}
                  onChange={handleChange("address")}
                  error={!!errors.address}
                />
              </FormField>
              <FormField
                label="상세 주소"
                htmlFor="addressDetail"
                required
                error={errors.addressDetail}
              >
                <Input
                  id="addressDetail"
                  placeholder="상세 주소 입력"
                  value={form.addressDetail}
                  onChange={handleChange("addressDetail")}
                  error={!!errors.addressDetail}
                />
              </FormField>
              <FormField
                label="우편번호"
                htmlFor="zipCode"
                required
                error={errors.zipCode}
              >
                <Input
                  id="zipCode"
                  placeholder="06014"
                  value={form.zipCode}
                  onChange={handleChange("zipCode")}
                  error={!!errors.zipCode}
                />
              </FormField>
              <FormField label="배송 메모" htmlFor="memo">
                <Input
                  id="memo"
                  placeholder="문 앞에 놓아주세요"
                  value={form.memo}
                  onChange={handleChange("memo")}
                />
              </FormField>
            </div>
          </section>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>결제수단 선택</h2>
          <section className="bg-white/80 p-6 shadow-sm ring-1 ring-gray-200">
            <div className="space-y-3">
              {[
                { value: "DEPOSIT", label: "예치금 결제" },
                { value: "CARD", label: "카드 결제" },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(method.value)}
                  className={[
                    "w-full border p-4 text-left transition",
                    selectedPaymentMethod === method.value
                      ? "border-blue-200 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-100 bg-white hover:bg-blue-50/70",
                  ].join(" ")}
                >
                  <p className="text-lg font-extrabold text-gray-900">{method.label}</p>
                </button>
              ))}
            </div>
          </section>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-gray-900" style={{ marginBottom: "0.875rem" }}>결제 요약</h2>
          <section className="bg-white/80 p-6 shadow-sm ring-1 ring-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">상품 금액</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(summary.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">배송비</span>
                <span className="font-bold text-gray-900">
                  {summary.shippingFee === 0
                    ? "무료"
                    : formatPrice(summary.shippingFee)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-end justify-between">
                  <span className="text-lg font-extrabold text-gray-900">
                    총 결제 금액
                  </span>
                  <span className="text-2xl font-extrabold tracking-tight text-blue-700">
                    {formatPrice(summary.total)}
                  </span>
                </div>
              </div>
            </div>
          </section>
          </div>
        </div>
        </div>
      </PageContainer>

      <footer className="fixed bottom-0 left-0 z-40 w-full bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl space-y-3 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{paymentMethodLabel}</span>
            <span className="text-lg font-extrabold text-blue-700">
              {formatPrice(summary.total)}원
            </span>
          </div>
          <Button
            size="lg"
            className="w-full"
            disabled={!hasCheckoutItems || isSubmitting}
            onClick={handleOpenConfirm}
          >
            {isSubmitting ? "처리 중..." : "결제 페이지로 이동"}
          </Button>
        </div>
      </footer>

      <ConfirmModal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="결제 페이지로 이동할까요?"
        description={`${paymentMethodLabel}로 총 ${formatPrice(summary.total)}원을 결제합니다.`}
        confirmText="다음으로"
        loading={isSubmitting}
        onConfirm={handleSubmitOrder}
      />
    </>
  );
}
