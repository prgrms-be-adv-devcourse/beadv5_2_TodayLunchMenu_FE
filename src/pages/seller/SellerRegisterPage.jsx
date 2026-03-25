import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import ConfirmModal from "../../components/common/ConfirmModal";

export default function SellerRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    sellerName: "",
    brandHandle: "",
    description: "",
    settlementAccount: "",
  });

  const [errors, setErrors] = useState({});
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};

    if (!form.sellerName.trim()) next.sellerName = "판매자 이름을 입력해 주세요.";
    if (!form.description.trim()) next.description = "소개를 입력해 주세요.";
    if (!form.settlementAccount.trim()) {
      next.settlementAccount = "정산 계좌 정보를 입력해 주세요.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setOpenConfirm(true);
  };

  const handleConfirm = async () => {
    const payload = {
      sellerName: form.sellerName,
      description: form.description,
      settlementAccount: form.settlementAccount,
      brandHandle: form.brandHandle || null,
    };

    console.log("seller register payload", payload);
    setOpenConfirm(false);
    navigate("/seller/products");
  };

  return (
    <>
      <PageContainer>
        <section className="mb-8">
          <div className="mb-2 flex justify-between items-end">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-700">
              Step 1 of 1
            </span>
            <span className="text-sm font-bold text-gray-500">
              판매자 등록
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-700 to-violet-600" />
          </div>
        </section>

        <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-gray-900">
          판매자로 시작하기
        </h1>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
            <div className="mb-6 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-purple-200 bg-purple-50 text-4xl text-violet-700">
                  📷
                </div>
                <div className="absolute bottom-0 right-0 rounded-full bg-violet-700 p-2 text-white shadow-lg">
                  ✎
                </div>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                브랜드 로고 (선택)
              </p>
            </div>

            <div className="space-y-6">
              <FormField
                label="판매자명 / 브랜드명"
                htmlFor="sellerName"
                required
                error={errors.sellerName}
              >
                <Input
                  id="sellerName"
                  placeholder="예: zero.goods"
                  value={form.sellerName}
                  onChange={handleChange("sellerName")}
                  error={!!errors.sellerName}
                />
              </FormField>

              <FormField
                label="브랜드 핸들"
                htmlFor="brandHandle"
                helpText="선택 입력입니다. 기능정의서 필수값은 아닙니다."
              >
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-bold text-violet-700">
                    zeromarket/
                  </span>
                  <Input
                    id="brandHandle"
                    placeholder="your-brand"
                    value={form.brandHandle}
                    onChange={handleChange("brandHandle")}
                    className="pl-[110px]"
                  />
                </div>
              </FormField>

              <FormField
                label="소개"
                htmlFor="description"
                required
                error={errors.description}
              >
                <textarea
                  id="description"
                  rows={4}
                  placeholder="브랜드와 상품을 소개해 주세요."
                  value={form.description}
                  onChange={handleChange("description")}
                  className="w-full rounded-xl bg-purple-100/70 p-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-500/60 focus:ring-2 focus:ring-violet-300"
                />
              </FormField>

              <FormField
                label="정산 계좌"
                htmlFor="settlementAccount"
                required
                error={errors.settlementAccount}
                helpText="예: 국민은행 123456-78-123456"
              >
                <Input
                  id="settlementAccount"
                  placeholder="은행명 + 계좌번호"
                  value={form.settlementAccount}
                  onChange={handleChange("settlementAccount")}
                  error={!!errors.settlementAccount}
                />
              </FormField>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-4 rounded-2xl bg-purple-50/80 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                ⚡
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">빠른 등록</h4>
                <p className="text-xs text-gray-500">
                  세미프로젝트 기준으로 판매자 등록 후 바로 상품 등록이 가능합니다.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
                💸
              </div>
              <h4 className="text-xs font-bold text-gray-900">정산 지원</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
                판매 완료 후 정산/출금 흐름과 연결됩니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-violet-700">
                🛟
              </div>
              <h4 className="text-xs font-bold text-gray-900">운영 지원</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
                내 상품 관리와 주문 조회 화면으로 이어집니다.
              </p>
            </div>
          </section>

          <div className="sticky bottom-4 z-10">
            <Button type="submit" size="lg" className="w-full">
              판매자 등록 완료
            </Button>
          </div>
        </form>
      </PageContainer>

      <ConfirmModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        title="판매자로 등록할까요?"
        description="등록 후 바로 판매자 전용 메뉴를 사용할 수 있습니다."
        confirmText="등록하기"
        onConfirm={handleConfirm}
      />
    </>
  );
}