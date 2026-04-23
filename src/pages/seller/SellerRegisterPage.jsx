import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import ConfirmModal from "../../components/common/ConfirmModal";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { savePendingSellerVerification } from "../../features/seller/accountVerificationStorage";
import { useSeller } from "../../features/seller/useSeller";

export default function SellerRegisterPage() {
  const navigate = useNavigate();
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

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const verification = await registerSeller({
        bankName: form.bankName.trim(),
        account: form.account.trim(),
      });

      const nextState = {
        ...verification,
        bankName: form.bankName.trim(),
      };

      savePendingSellerVerification(nextState);
      setOpenConfirm(false);
      navigate("/seller/account-verification", { state: nextState });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "판매자 등록 요청 중 오류가 발생했습니다."
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
              Step 1 of 2
            </span>
            <span className="text-sm font-bold text-gray-500">판매자 등록</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-violet-700 to-violet-600" />
          </div>
        </section>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-gray-900">
          정산 계좌를 등록하고 판매를 시작해보세요
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500">
          계좌 정보를 먼저 등록하면 다음 단계에서 mock 인증 코드가 자동 입력된 계좌
          인증 화면으로 이동합니다.
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
                  placeholder="예: 우리의은행"
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
                helpText="하이픈은 자동으로 무시되므로 편한 형식으로 입력해도 됩니다."
              >
                <Input
                  id="account"
                  placeholder="예: 1234-5678-9012"
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
            <div className="col-span-2 rounded-2xl bg-purple-50/80 p-4">
              <h4 className="text-sm font-bold text-gray-900">다음 단계 자동 연결</h4>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                등록이 완료되면 계좌 인증 후속 페이지로 이동하고, mock 인증 코드는 자동으로
                입력됩니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
              <h4 className="text-xs font-bold text-gray-900">자동 입력 코드</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                개발용 인증 코드는 다음 화면에서 자동으로 채워집니다.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
              <h4 className="text-xs font-bold text-gray-900">판매자 전환</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                계좌 인증 완료 후 판매 기능 화면으로 자연스럽게 이어집니다.
              </p>
            </div>
          </section>

          <div className="sticky bottom-4 z-10">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "등록 중..." : "계좌 인증 단계로 이동"}
            </Button>
          </div>
        </form>
      </PageContainer>

      <ConfirmModal
        open={openConfirm}
        onClose={() => !isSubmitting && setOpenConfirm(false)}
        title="계좌 인증을 시작할까요?"
        description="등록 후 다음 화면에서 자동 입력된 mock 인증 코드로 계좌 인증을 완료할 수 있습니다."
        confirmText={isSubmitting ? "등록 중..." : "인증 시작하기"}
        onConfirm={handleConfirm}
      />
    </>
  );
}
