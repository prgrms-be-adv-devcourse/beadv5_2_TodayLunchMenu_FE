import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import FormField from "../../components/common/FormField";
import ConfirmModal from "../../components/common/ConfirmModal";

const MOCK_CHECKOUT_ITEMS = [
  {
    id: 1,
    productId: 101,
    name: "보라 머그컵",
    optionLabel: "리빙 · 라벤더",
    quantity: 1,
    price: 12000,
    image:
      "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    productId: 102,
    name: "제로마켓 키링",
    optionLabel: "굿즈 · 실버",
    quantity: 2,
    price: 8000,
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=800&q=80",
  },
];

const MOCK_DEPOSIT_BALANCE = 42000;

function formatPrice(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    receiverName: "",
    phone: "",
    address: "",
    detailAddress: "",
    memo: "",
  });

  const [errors, setErrors] = useState({});
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = useMemo(() => {
    const subtotal = MOCK_CHECKOUT_ITEMS.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingFee = subtotal >= 30000 || subtotal === 0 ? 0 : 3000;
    const total = subtotal + shippingFee;
    const hasEnoughDeposit = MOCK_DEPOSIT_BALANCE >= total;

    return {
      subtotal,
      shippingFee,
      total,
      hasEnoughDeposit,
      shortageAmount: hasEnoughDeposit ? 0 : total - MOCK_DEPOSIT_BALANCE,
    };
  }, []);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.receiverName.trim()) {
      nextErrors.receiverName = "수령인을 입력해 주세요.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "연락처를 입력해 주세요.";
    }

    if (!form.address.trim()) {
      nextErrors.address = "배송지를 입력해 주세요.";
    }

    if (!form.detailAddress.trim()) {
      nextErrors.detailAddress = "상세 주소를 입력해 주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleOpenConfirm = () => {
    if (!validate()) return;
    if (!summary.hasEnoughDeposit) return;
    setOpenConfirmModal(true);
  };

  const handleSubmitOrder = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        cartItemIds: MOCK_CHECKOUT_ITEMS.map((item) => item.id),
        shippingAddress: `${form.address} ${form.detailAddress}`,
        receiverName: form.receiverName,
        receiverPhone: form.phone,
        memo: form.memo,
      };

      console.log("주문 생성 요청", payload);

      setOpenConfirmModal(false);
      navigate("/orders");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageContainer>
        <PageHeader title="체크아웃" />

        <section className="mb-6 rounded-[28px] bg-gradient-to-br from-violet-700 to-fuchsia-600 p-5 text-white shadow-xl shadow-violet-500/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-100">
              Checkout Flow
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-xs font-bold text-violet-100">STEP 1</p>
              <p className="mt-1 text-sm font-extrabold">장바구니</p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 text-violet-700">
              <p className="text-xs font-bold">STEP 2</p>
              <p className="mt-1 text-sm font-extrabold">체크아웃</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-3 py-3">
              <p className="text-xs font-bold text-violet-100">STEP 3</p>
              <p className="mt-1 text-sm font-extrabold">주문완료</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
              <h2 className="mb-4 text-xl font-extrabold tracking-tight text-gray-900">
                배송 정보
              </h2>

              <div className="space-y-4">
                <FormField
                  label="수령인"
                  htmlFor="receiverName"
                  required
                  error={errors.receiverName}
                >
                  <Input
                    id="receiverName"
                    placeholder="홍길동"
                    value={form.receiverName}
                    onChange={handleChange("receiverName")}
                    error={!!errors.receiverName}
                  />
                </FormField>

                <FormField
                  label="연락처"
                  htmlFor="phone"
                  required
                  error={errors.phone}
                >
                  <Input
                    id="phone"
                    placeholder="010-1234-5678"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    error={!!errors.phone}
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
                    placeholder="서울특별시 ..."
                    value={form.address}
                    onChange={handleChange("address")}
                    error={!!errors.address}
                  />
                </FormField>

                <FormField
                  label="상세 주소"
                  htmlFor="detailAddress"
                  required
                  error={errors.detailAddress}
                >
                  <Input
                    id="detailAddress"
                    placeholder="상세 주소 입력"
                    value={form.detailAddress}
                    onChange={handleChange("detailAddress")}
                    error={!!errors.detailAddress}
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

            <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
              <h2 className="mb-4 text-xl font-extrabold tracking-tight text-gray-900">
                주문 상품
              </h2>

              <div className="space-y-4">
                {MOCK_CHECKOUT_ITEMS.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-2xl bg-purple-50/60 p-4"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-purple-50">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-1 items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                          {item.optionLabel}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">
                          수량 {item.quantity}개
                        </p>
                      </div>

                      <p className="text-lg font-extrabold text-violet-700">
                        {formatPrice(item.price * item.quantity)}원
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
              <h2 className="mb-4 text-xl font-extrabold tracking-tight text-gray-900">
                예치금 결제
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">현재 예치금</span>
                  <span className="font-extrabold text-violet-700">
                    {formatPrice(MOCK_DEPOSIT_BALANCE)}원
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">결제 예정 금액</span>
                  <span className="font-extrabold text-gray-900">
                    {formatPrice(summary.total)}원
                  </span>
                </div>

                <div className="border-t border-purple-100 pt-3">
                  {summary.hasEnoughDeposit ? (
                    <p className="text-sm font-medium text-violet-700">
                      예치금으로 바로 결제할 수 있어요.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-500">
                        예치금이 부족합니다.{" "}
                        {formatPrice(summary.shortageAmount)}원이 더 필요해요.
                      </p>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => navigate("/deposits")}
                      >
                        예치금 충전하러 가기
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
              <h2 className="mb-4 text-xl font-extrabold tracking-tight text-gray-900">
                결제 요약
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">상품 금액</span>
                  <span className="font-bold text-gray-900">
                    {formatPrice(summary.subtotal)}원
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">배송비</span>
                  <span className="font-bold text-gray-900">
                    {summary.shippingFee === 0
                      ? "무료"
                      : `${formatPrice(summary.shippingFee)}원`}
                  </span>
                </div>

                <div className="border-t border-purple-100 pt-4">
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-extrabold text-gray-900">
                      총 결제 금액
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight text-violet-700">
                      {formatPrice(summary.total)}원
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  size="lg"
                  className="w-full"
                  disabled={!summary.hasEnoughDeposit}
                  onClick={handleOpenConfirm}
                >
                  주문 생성하기
                </Button>
              </div>
            </section>
          </div>
        </div>
      </PageContainer>

      <ConfirmModal
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        title="주문을 생성할까요?"
        description={`총 ${formatPrice(
          summary.total
        )}원이 예치금에서 차감됩니다.`}
        confirmText="주문 생성"
        loading={isSubmitting}
        onConfirm={handleSubmitOrder}
      />
    </>
  );
}