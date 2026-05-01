import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError } from '../../api/client';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import Input from '../../components/common/Input';
import PageContainer from '../../components/common/PageContainer';
import { changeCurrentMemberPasswordApi } from '../../features/member/memberApi';
import { pushToast } from '../../features/notification/notificationToastStore';
import { cn } from '../../utils/cn';

export default function MemberPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '', common: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.currentPassword) {
      nextErrors.currentPassword = '현재 비밀번호를 입력해 주세요.';
    }

    if (!form.newPassword) {
      nextErrors.newPassword = '새 비밀번호를 입력해 주세요.';
    } else if (form.newPassword.length < 8) {
      nextErrors.newPassword = '새 비밀번호는 8자 이상이어야 합니다.';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = '새 비밀번호 확인을 입력해 주세요.';
    } else if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = '새 비밀번호가 일치하지 않습니다.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors((prev) => ({ ...prev, common: '' }));

      await changeCurrentMemberPasswordApi({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      pushToast({
        title: '비밀번호 변경 완료',
        message: '새 비밀번호가 저장되었습니다.',
        tone: 'success',
        timeoutMs: 2500,
      });
      navigate('/me');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors((prev) => ({
          ...prev,
          common: error.message || '비밀번호 변경에 실패했습니다.',
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          common: '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mx-auto max-w-md">
        <div className="mb-6 border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-medium leading-7 text-blue-700">
          안전한 비밀번호로 변경할 준비가 되었습니다.
        </div>

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">Password Update</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">비밀번호 변경</h1>
          <p className="mt-2 text-sm leading-7 text-gray-500">
            현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 text-left bg-white p-6 shadow-sm ring-1 ring-gray-200"
        >
          <FormField label="현재 비밀번호" htmlFor="currentPassword" required error={errors.currentPassword}>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="현재 비밀번호를 입력하세요"
                value={form.currentPassword}
                onChange={handleChange('currentPassword')}
                error={!!errors.currentPassword}
                className="bg-blue-50 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 transition hover:text-blue-700"
              >
                {showCurrentPassword ? '숨김' : '보기'}
              </button>
            </div>
          </FormField>

          <FormField
            label="새 비밀번호"
            htmlFor="newPassword"
            required
            error={errors.newPassword}
            helpText="새 비밀번호는 8자 이상으로 입력해 주세요."
          >
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="새 비밀번호 입력"
                value={form.newPassword}
                onChange={handleChange('newPassword')}
                error={!!errors.newPassword}
                className="bg-blue-50 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 transition hover:text-blue-700"
              >
                {showNewPassword ? '숨김' : '보기'}
              </button>
            </div>
          </FormField>

          <FormField label="새 비밀번호 확인" htmlFor="confirmPassword" required error={errors.confirmPassword}>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="새 비밀번호 다시 입력"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                error={!!errors.confirmPassword}
                className="bg-blue-50 pr-16"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 transition hover:text-blue-700"
              >
                {showConfirmPassword ? '숨김' : '보기'}
              </button>
            </div>
          </FormField>

          {errors.common ? (
            <div className="bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {errors.common}
            </div>
          ) : null}

          <div className="space-y-3 pt-2">
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '변경 중...' : '변경하기'}
            </Button>
            <Link to="/me/edit" className="block">
              <Button type="button" variant="ghost" size="lg" className="w-full">
                뒤로가기
              </Button>
            </Link>
          </div>
        </form>

        <div className="mt-8 border-2 border-white bg-white/70 p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              !
            </span>
            보안 가이드
          </h2>
          <ul className="mt-4 space-y-2 text-xs leading-relaxed text-gray-500">
            {[
              '비밀번호는 주기적으로 변경하는 것이 안전합니다.',
              '다른 사이트와 동일한 비밀번호는 사용하지 마세요.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className={cn('mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-600')} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
