import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { useAuth } from "../../features/auth/useAuth";
import { useSeller } from "../../features/seller/useSeller";

export default function SellerRegisterPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { registerSeller } = useSeller(false);

  const [form, setForm] = useState({
    bankName: "",
    account: "",
  });
  const [errors, setErrors] = useState({});
  const [openConfirm, setOpenConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const next = {};

    if (!form.bankName.trim()) {
      next.bankName = "은행명을 입력해 주세요.";
    }

    if (!form.account.trim()) {
      next.account = "계좌번호를 입력해 주세요.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setOpenConfirm(true);
  };

  // 판매자 등록을 확정하는 함수 (API 호출, 사용자 정보 새로고침)
  const handleConfirm = async () => {
    console.log("판매자 등록 정보:", form);
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // 판매자 등록 API를 호출하여 판매자 등록을 시도합니다. 
      await registerSeller({
        bankName: form.bankName.trim(),
        account: form.account.trim(),
      });
      // 등록이 성공하면 사용자 정보를 새로고침하여 판매자 권한이 반영되도록 합니다.
      await refreshUser();

      setOpenConfirm(false);
      navigate("/seller/products");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "판매자 등록 중 오류가 발생했습니다."
      );
      setOpenConfirm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageContainer>
        <section className="mb-8">
          <div className="mb-2 flex items-end justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-700">
              Step 1 of 1
            </span>
            <span className="text-sm font-bold text-gray-500">판매자 등록</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-violet-700 to-violet-600" />
          </div>
        </section>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900">
          정산 계좌를 등록해 판매를 시작해보세요
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          현재 백엔드 판매자 등록 API는 은행명과 계좌번호를 기준으로 판매자 정보를 생성합니다.
        </p>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-purple-100">
            <div className="space-y-6">
              <FormField
                label="은행명"
                htmlFor="bankName"
                required
                error={errors.bankName}
              >
                <Input
                  id="bankName"
                  placeholder="예: 국민은행"
                  value={form.bankName}
                  onChange={handleChange("bankName")}
                  error={!!errors.bankName}
                />
              </FormField>

              <FormField
                label="계좌번호"
                htmlFor="account"
                required
                error={errors.account}
                helpText="하이픈 포함 여부와 관계없이 입력하실 수 있습니다."
              >
                <Input
                  id="account"
                  placeholder="예: 123456-78-123456"
                  value={form.account}
                  onChange={handleChange("account")}
                  error={!!errors.account}
                />
              </FormField>
            </div>
          </section>

          {submitError ? (
            <section className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {submitError}
            </section>
          ) : null}

          <section className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-4 rounded-2xl bg-purple-50/80 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                ₩
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">간단한 등록</h4>
                <p className="text-xs text-gray-500">
                  정산 계좌 정보만 입력하면 바로 판매자 등록을 완료할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
                ✓
              </div>
              <h4 className="text-xs font-bold text-gray-900">정산 정보 저장</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
                등록 시 입력한 은행명과 계좌번호가 판매자 정보로 저장됩니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-violet-700">
                →
              </div>
              <h4 className="text-xs font-bold text-gray-900">판매자 센터 이동</h4>
              <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
                등록이 끝나면 상품 관리 화면으로 이동합니다.
              </p>
            </div>
          </section>

          <div className="sticky bottom-4 z-10">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "판매자 등록 완료"}
            </Button>
          </div>
        </form>
      </PageContainer>

      <ConfirmModal
        open={openConfirm}
        onClose={() => !isSubmitting && setOpenConfirm(false)}
        title="판매자로 등록할까요?"
        description="등록 후 바로 판매자 전용 메뉴를 사용할 수 있습니다."
        confirmText={isSubmitting ? "등록 중..." : "등록하기"}
        onConfirm={handleConfirm}
      />
    </>
  );
}
