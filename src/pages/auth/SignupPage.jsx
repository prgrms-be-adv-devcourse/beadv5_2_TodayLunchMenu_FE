import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import CheckboxField from "../../components/common/CheckboxField";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import { ApiError } from "../../api/client";
import { signupApi } from "../../features/auth/authApi";
import {
  presignProfileImageUploadApi,
  uploadProfileImageToS3,
} from "../../features/member/memberApi";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [profileImage, setProfileImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;

    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "", common: "" }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;

    setProfileImage(file);
    setErrors((prev) => ({ ...prev, profileImage: "", common: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "이름을 입력해 주세요.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "이메일을 입력해 주세요.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = "올바른 이메일 형식이 아닙니다.";
    }

    if (!form.password) {
      nextErrors.password = "비밀번호를 입력해 주세요.";
    } else if (form.password.length < 8) {
      nextErrors.password = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "비밀번호 확인을 입력해 주세요.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    if (profileImage && !ACCEPTED_IMAGE_TYPES.includes(profileImage.type)) {
      nextErrors.profileImage = "jpg, png, webp 형식의 이미지 파일만 업로드할 수 있습니다.";
    }

    if (!form.agree) {
      nextErrors.agree = "약관 동의가 필요합니다.";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setErrors((prev) => ({ ...prev, common: "" }));

      const profileImageKey = await uploadProfileImageIfNeeded();

      const signupData = await signupApi({
        email: form.email.trim(),
        password: form.password,
        nickname: form.name.trim(),
        phone: null,
        address: null,
        profileImageKey,
        role: "USER",
      });

      if (signupData?.status === "PENDING_VERIFICATION") {
        navigate(
          `/signup/pending-verification?email=${encodeURIComponent(
            signupData.email || form.email.trim()
          )}`
        );
        return;
      }

      navigate("/login");
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors((prev) => ({
          ...prev,
          common: error.message || "회원가입에 실패했습니다.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          common: "회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf3ff] text-[#38274c]">
      <header className="fixed top-0 z-50 w-full bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-6">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-violet-700 transition hover:bg-violet-100 active:scale-95"
          >
            ←
          </button>

          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold tracking-tight">Sign Up</h1>
          </div>

          <div className="w-10" />
        </div>
      </header>

      <main className="flex min-h-screen items-center justify-center px-6 pb-12 pt-24">
        <div className="grid w-full max-w-6xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <section className="relative hidden aspect-[4/5] overflow-hidden rounded-xl bg-purple-100 p-12 md:flex md:flex-col md:justify-end">
            <div className="absolute inset-0 bg-gradient-to-t from-violet-500/30 to-transparent" />
            <div className="relative z-10 space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
                The Archive Edition
              </span>
              <h2 className="text-5xl font-extrabold leading-[0.9] tracking-tighter">
                Curate
                <br />
                Your
                <br />
                Legacy.
              </h2>
              <p className="max-w-xs font-medium text-gray-600">
                취향과 기록을 모으는 사람들을 위한 마켓에 참여해 보세요.
              </p>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md space-y-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-extrabold tracking-tight">회원가입</h2>
              <p className="font-medium text-gray-500">
                정보를 입력하고 TodayLunchMenu를 시작해 보세요.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <FormField label="Full Name" htmlFor="name" required error={errors.name}>
                  <Input
                    id="name"
                    type="text"
                    placeholder="닉네임"
                    value={form.name}
                    onChange={handleChange("name")}
                    error={!!errors.name}
                  />
                </FormField>

                <FormField label="Email Address" htmlFor="email" required error={errors.email}>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange("email")}
                    error={!!errors.email}
                  />
                </FormField>

                <FormField label="Profile Image" htmlFor="profileImage" error={errors.profileImage}>
                  <input
                    id="profileImage"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleProfileImageChange}
                    className="block w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-semibold file:text-violet-700 hover:file:bg-violet-200"
                  />
                  {profileImage ? (
                    <p className="mt-2 text-xs font-medium text-gray-500">선택한 파일: {profileImage.name}</p>
                  ) : null}
                </FormField>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="Password" htmlFor="password" required error={errors.password}>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      value={form.password}
                      onChange={handleChange("password")}
                      error={!!errors.password}
                    />
                  </FormField>

                  <FormField label="Confirm" htmlFor="confirmPassword" required error={errors.confirmPassword}>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="********"
                      value={form.confirmPassword}
                      onChange={handleChange("confirmPassword")}
                      error={!!errors.confirmPassword}
                    />
                  </FormField>
                </div>
              </div>

              <CheckboxField
                id="agree"
                checked={form.agree}
                onChange={handleChange("agree")}
                error={errors.agree}
                label={
                  <>
                    이용약관 및{' '}
                    <a href="#" className="font-semibold text-violet-700 hover:underline">
                      개인정보 처리방침
                    </a>
                    에 동의합니다.
                  </>
                }
              />

              {errors.common ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {errors.common}
                </div>
              ) : null}

              <div className="pt-2">
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "가입 중..." : "회원가입"}
                </Button>
              </div>
            </form>

            <div className="pt-4 text-center">
              <p className="font-medium text-gray-500">
                이미 계정이 있나요?
                <Link to="/login" className="ml-1 font-bold text-violet-700 hover:underline">
                  로그인
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
