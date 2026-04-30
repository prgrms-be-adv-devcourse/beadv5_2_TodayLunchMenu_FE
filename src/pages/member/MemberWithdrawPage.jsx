import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import { ApiError } from "../../api/client";
import { clearAuthState } from "../../features/auth/authStore";
import { withdrawCurrentMemberApi } from "../../features/member/memberApi";
import { pushToast } from "../../features/notification/notificationToastStore";

export default function MemberWithdrawPage() {
  const navigate = useNavigate();
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async (event) => {
    event.preventDefault();

    if (!withdrawPassword.trim()) {
      setErrors({
        password: "회원탈퇴를 진행하려면 현재 비밀번호를 입력해 주세요.",
        common: "",
      });
      return;
    }

    const confirmed = window.confirm(
      "회원탈퇴 후에는 계정을 복구할 수 없습니다. 정말 탈퇴하시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsWithdrawing(true);
      setErrors({});

      await withdrawCurrentMemberApi({
        currentPassword: withdrawPassword.trim(),
      });

      clearAuthState();
      pushToast({
        title: "회원탈퇴 완료",
        message: "계정이 탈퇴 처리되어 로그아웃되었습니다.",
        tone: "success",
        timeoutMs: 3000,
      });
      navigate("/login", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          password: "",
          common: error.message || "회원탈퇴에 실패했습니다.",
        });
        return;
      }

      setErrors({
        password: "",
        common: "회원탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              Danger Zone
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
              회원탈퇴
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              회원탈퇴 후에는 계정을 복구할 수 없습니다. 진행 중인 주문, 정산, 환불이 있는 경우 탈퇴가 제한될 수 있습니다.
            </p>
          </div>
          <Link to="/me/edit">
            <Button variant="secondary">내 정보수정으로</Button>
          </Link>
        </div>

        <section className="border border-red-200 bg-red-50 p-8 shadow-sm">
          <form onSubmit={handleWithdraw} className="space-y-4">
            <FormField
              label="현재 비밀번호 확인"
              htmlFor="withdrawPassword"
              required
              error={errors.password}
            >
              <Input
                id="withdrawPassword"
                type="password"
                value={withdrawPassword}
                onChange={(event) => {
                  setWithdrawPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: "", common: "" }));
                }}
                error={!!errors.password}
              />
            </FormField>

            {errors.common ? (
              <div className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-red-600 ring-1 ring-red-200">
                {errors.common}
              </div>
            ) : null}

            <div className="flex justify-end gap-3">
              <Link to="/me/edit">
                <Button type="button" variant="secondary">취소</Button>
              </Link>
              <Button type="submit" disabled={isWithdrawing}>
                {isWithdrawing ? "탈퇴 처리 중..." : "회원탈퇴"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </PageContainer>
  );
}
