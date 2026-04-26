import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import Input from '../../components/common/Input';
import PageContainer from '../../components/common/PageContainer';
import { ApiError } from '../../api/client';
import { useAuth } from '../../features/auth/useAuth';
import {
  presignProfileImageUploadApi,
  updateCurrentMemberApi,
  uploadProfileImageToS3,
} from '../../features/member/memberApi';
import { pushToast } from '../../features/notification/notificationToastStore';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MemberEditPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    phone: '',
    address: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      nickname: user.nickname ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
    });
  }, [user]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: '', common: '' }));
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setProfileImage(file);
    setErrors((prev) => ({ ...prev, profileImage: '', common: '' }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.nickname.trim()) {
      nextErrors.nickname = '닉네임을 입력해 주세요.';
    }

    if (profileImage && !ACCEPTED_IMAGE_TYPES.includes(profileImage.type)) {
      nextErrors.profileImage = 'jpg, png, webp 형식의 이미지 파일만 업로드할 수 있습니다.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const uploadProfileImageIfNeeded = async () => {
    if (!profileImage) {
      return null;
    }

    const presignedData = await presignProfileImageUploadApi({
      fileName: profileImage.name,
      contentType: profileImage.type,
    });

    await uploadProfileImageToS3({
      uploadUrl: presignedData.uploadUrl,
      file: profileImage,
      contentType: profileImage.type,
    });

    return presignedData.objectKey;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors((prev) => ({ ...prev, common: '' }));

      const profileImageKey = await uploadProfileImageIfNeeded();

      await updateCurrentMemberApi({
        nickname: form.nickname.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        profileImageKey,
      });

      await refreshUser();
      pushToast({
        title: '프로필 저장 완료',
        message: '변경한 내용이 반영되었습니다.',
        tone: 'success',
        timeoutMs: 2500,
      });
      navigate('/me');
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors((prev) => ({ ...prev, common: error.message || '프로필 저장에 실패했습니다.' }));
      } else {
        setErrors((prev) => ({ ...prev, common: '프로필 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading && !user) {
    return (
      <PageContainer>
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-sm font-medium text-gray-500 shadow-sm ring-1 ring-violet-100">
          회원 정보를 불러오는 중입니다...
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-500">Profile Edit</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">프로필 편집</h1>
            <Link
              to="/me/password"
              className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-violet-100 px-5 text-sm font-semibold text-violet-800 transition hover:bg-violet-200"
            >
              비밀번호 변경으로 이동
            </Link>
          </div>
          <Link to="/me">
            <Button variant="secondary">뒤로가기</Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-violet-100">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt="현재 프로필 이미지"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-violet-100"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-violet-600 text-2xl font-extrabold text-white">
                {(form.nickname || user?.nickname || 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <FormField label="프로필 이미지" htmlFor="profileImage" error={errors.profileImage}>
                <input
                  id="profileImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleProfileImageChange}
                  className="block w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-semibold file:text-violet-700 hover:file:bg-violet-200"
                />
                {profileImage ? (
                  <p className="mt-2 text-xs font-medium text-gray-500">새 파일: {profileImage.name}</p>
                ) : (
                  <p className="mt-2 text-xs font-medium text-gray-500">이미지를 선택하지 않으면 기존 프로필 사진을 유지합니다.</p>
                )}
              </FormField>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="닉네임" htmlFor="nickname" required error={errors.nickname}>
              <Input id="nickname" value={form.nickname} onChange={handleChange('nickname')} error={!!errors.nickname} />
            </FormField>

            <FormField
              label="이메일"
              htmlFor="email"
              helpText="이메일 주소는 현재 이 화면에서 변경할 수 없습니다."
            >
              <Input id="email" type="email" value={form.email} disabled readOnly />
            </FormField>

            <FormField label="전화번호" htmlFor="phone" error={errors.phone}>
              <Input id="phone" value={form.phone} onChange={handleChange('phone')} error={!!errors.phone} />
            </FormField>

            <FormField label="주소" htmlFor="address" error={errors.address}>
              <Input id="address" value={form.address} onChange={handleChange('address')} error={!!errors.address} />
            </FormField>
          </div>

          {errors.common ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{errors.common}</div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Link to="/me">
              <Button type="button" variant="secondary">취소</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
}

