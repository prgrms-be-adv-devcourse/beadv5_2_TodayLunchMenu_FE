import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import {
  deleteProductImageApi,
  getCategoriesApi,
  getChildCategoriesApi,
  getProductDetailApi,
  setImageThumbnailApi,
  updateProductApi,
  uploadProductImageApi,
} from "../../features/product/productApi";

const MIN_PRICE = 1000;
const MIN_STOCK = 0;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_FILES = 5;

const STATUS_META = {
  ACTIVE:   { label: "판매중", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  SOLD_OUT: { label: "품절",   dot: "bg-red-500",     badge: "bg-red-50 text-red-600 border border-red-200" },
  INACTIVE: { label: "비공개", dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-500 border border-gray-200" },
};

function formatPrice(v) {
  if (!v && v !== 0) return "0";
  return new Intl.NumberFormat("ko-KR").format(v);
}

// 번호 섹션 카드
function SectionCard({ number, title, children }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {number}
        </span>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

// 좌측 레이블 + 우측 콘텐츠 행
function FieldRow({ label, required, error, helpText, children }) {
  return (
    <div className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-start sm:gap-0">
      <div className="flex w-full items-center gap-1 sm:w-36 sm:flex-shrink-0 sm:pt-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {required && <span className="text-red-500">*</span>}
      </div>
      <div className="flex-1">
        {children}
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        {!error && helpText && <p className="mt-1.5 text-xs text-gray-400">{helpText}</p>}
      </div>
    </div>
  );
}

const INPUT_CLASS =
  "h-11 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400";

const SELECT_CLASS =
  "h-11 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400";

export default function SellerProductEditPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [productStatus, setProductStatus] = useState(null);
  const [images, setImages] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [settingThumbnailId, setSettingThumbnailId] = useState(null);
  const [previewIdx, setPreviewIdx] = useState(null);
  const [imageError, setImageError] = useState("");
  const [imageLimitModal, setImageLimitModal] = useState({ open: false, title: "", description: "" });

  const [form, setForm] = useState({
    title: "", description: "", price: "", stockQuantity: 0, categoryId: "",
  });
  const [categorySelection, setCategorySelection] = useState({ depth0Id: "", depth1Id: "", depth2Id: "" });
  const [categories, setCategories] = useState({ depth0: [], depth1: [], depth2: [] });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setPageLoading(true);
        const [product, depth0] = await Promise.all([
          getProductDetailApi(productId),
          getCategoriesApi({ depth: 0 }),
        ]);
        if (cancelled) return;
        setProductStatus(product.status);
        setImages(product.images ?? []);
        setCategories((prev) => ({ ...prev, depth0 }));
        const isDefaultDesc = product.description === "상품 설명이 아직 등록되지 않았습니다.";
        setForm({
          title: product.name,
          description: isDefaultDesc ? "" : (product.description || ""),
          price: String(product.price),
          stockQuantity: product.stockCount,
          categoryId: product.categoryId || "",
        });
        if (!product.categoryId) return;
        const depth1 = await getChildCategoriesApi(product.categoryId);
        if (cancelled) return;
        if (depth1.length > 0) {
          setCategories((prev) => ({ ...prev, depth1 }));
          const matched = depth1.find((c) => c.name === product.category);
          if (matched) {
            setCategorySelection({ depth0Id: product.categoryId, depth1Id: matched.id, depth2Id: "" });
            setForm((prev) => ({ ...prev, categoryId: matched.id }));
            const depth2 = await getChildCategoriesApi(matched.id);
            if (!cancelled && depth2.length > 0) setCategories((prev) => ({ ...prev, depth2 }));
          } else {
            setCategorySelection({ depth0Id: product.categoryId, depth1Id: "", depth2Id: "" });
          }
        } else {
          setCategorySelection({ depth0Id: product.categoryId, depth1Id: "", depth2Id: "" });
        }
      } catch (err) {
        if (!cancelled) setPageError(err?.message || "상품 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [productId]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setImageError("");
    if (images.length >= MAX_IMAGE_FILES) {
      setImageError(`상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.`);
      setImageLimitModal({ open: true, title: "이미지 개수 제한", description: `상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.` });
      return;
    }
    const remainingSlots = MAX_IMAGE_FILES - images.length;
    const nextFiles = files.slice(0, remainingSlots);
    const oversizedFile = nextFiles.find((file) => file.size > MAX_IMAGE_FILE_SIZE);
    if (oversizedFile) {
      setImageError("이미지 파일은 각각 5MB 이하여야 합니다.");
      setImageLimitModal({ open: true, title: "이미지 용량 초과", description: "이미지 파일은 파일당 최대 5MB까지 업로드할 수 있습니다. 파일 크기를 줄인 뒤 다시 시도해 주세요." });
      return;
    }
    if (files.length > remainingSlots) {
      setImageError(`상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.`);
      setImageLimitModal({ open: true, title: "이미지 개수 제한", description: `최대 ${MAX_IMAGE_FILES}장까지만 등록할 수 있어 선택한 이미지 중 일부만 업로드됩니다.` });
    }
    const isFirstImage = images.length === 0;
    setUploadingCount((n) => n + nextFiles.length);
    const results = await Promise.allSettled(
      nextFiles.map((file, idx) =>
        uploadProductImageApi(productId, file, {
          sortOrder: images.length + idx,
          isThumbnail: isFirstImage && idx === 0,
        })
      )
    );
    setUploadingCount((n) => n - nextFiles.length);
    const succeeded = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failCount = results.filter((r) => r.status === "rejected").length;
    if (succeeded.length > 0) setImages((prev) => [...prev, ...succeeded]);
    if (failCount > 0) setImageError(`${failCount}개 이미지 업로드에 실패했습니다.`);
  };

  const handleDeleteImage = async (imageId) => {
    setDeletingIds((prev) => new Set(prev).add(imageId));
    setImageError("");
    try {
      await deleteProductImageApi(productId, imageId);
      setImages((prev) => {
        const next = prev.filter((img) => img.id !== imageId);
        // 삭제된 이미지가 라이트박스에 열려 있으면 닫기
        setPreviewIdx((pi) => {
          if (pi === null) return null;
          const deletedIdx = prev.findIndex((img) => img.id === imageId);
          if (deletedIdx === -1) return pi;
          if (pi >= next.length) return next.length > 0 ? next.length - 1 : null;
          return pi > deletedIdx ? pi - 1 : pi;
        });
        return next;
      });
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : "이미지 삭제에 실패했습니다.");
    } finally {
      setDeletingIds((prev) => { const next = new Set(prev); next.delete(imageId); return next; });
    }
  };

  const handleSetThumbnail = async (imageId) => {
    if (settingThumbnailId) return;
    setSettingThumbnailId(imageId);
    setImageError("");
    try {
      await setImageThumbnailApi(productId, imageId);
      setImages((prev) => prev.map((img) => ({ ...img, isThumbnail: img.id === imageId })));
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : "대표 이미지 변경에 실패했습니다.");
    } finally {
      setSettingThumbnailId(null);
    }
  };

  // 라이트박스 키보드 탐색
  useEffect(() => {
    if (previewIdx === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPreviewIdx(null);
      else if (e.key === "ArrowRight") setPreviewIdx((i) => (i < images.length - 1 ? i + 1 : i));
      else if (e.key === "ArrowLeft") setPreviewIdx((i) => (i > 0 ? i - 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIdx, images.length]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSubmitError("");
  };

  const handleCategoryChange = async (depthKey, nextId) => {
    setErrors((prev) => ({ ...prev, categoryId: "" }));
    setSubmitError("");
    if (depthKey === "depth0Id") {
      setCategorySelection({ depth0Id: nextId, depth1Id: "", depth2Id: "" });
      setCategories((prev) => ({ ...prev, depth1: [], depth2: [] }));
      setForm((prev) => ({ ...prev, categoryId: nextId }));
      if (!nextId) return;
      const depth1 = await getChildCategoriesApi(nextId);
      setCategories((prev) => ({ ...prev, depth1 }));
    } else if (depthKey === "depth1Id") {
      setCategorySelection((prev) => ({ ...prev, depth1Id: nextId, depth2Id: "" }));
      setCategories((prev) => ({ ...prev, depth2: [] }));
      setForm((prev) => ({ ...prev, categoryId: nextId || categorySelection.depth0Id }));
      if (!nextId) return;
      const depth2 = await getChildCategoriesApi(nextId);
      setCategories((prev) => ({ ...prev, depth2 }));
    } else if (depthKey === "depth2Id") {
      setCategorySelection((prev) => ({ ...prev, depth2Id: nextId }));
      setForm((prev) => ({ ...prev, categoryId: nextId || categorySelection.depth1Id || categorySelection.depth0Id }));
    }
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "상품명을 입력해 주세요.";
    if (!form.categoryId) next.categoryId = "카테고리를 선택해 주세요.";
    const priceNum = Number(form.price);
    if (!String(form.price).trim()) next.price = "가격을 입력해 주세요.";
    else if (!Number.isInteger(priceNum)) next.price = "가격은 정수로 입력해 주세요.";
    else if (priceNum < MIN_PRICE) next.price = `최소 ${MIN_PRICE.toLocaleString()}원 이상이어야 합니다.`;
    const stockNum = Number(form.stockQuantity);
    if (String(form.stockQuantity).trim() === "") next.stockQuantity = "재고를 입력해 주세요.";
    else if (!Number.isInteger(stockNum) || stockNum < MIN_STOCK) next.stockQuantity = "재고는 0 이상의 정수여야 합니다.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      setSubmitError("");
      await updateProductApi(productId, {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categoryId: form.categoryId,
      });
      navigate("/seller/products");
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "상품 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-400">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">{pageError}</div>
        <button
          type="button"
          className="text-sm text-blue-600 underline underline-offset-2"
          onClick={() => navigate("/seller/products")}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const thumbnailImage = images.find((img) => img.isThumbnail) || images[0] || null;
  const statusMeta = STATUS_META[productStatus] ?? STATUS_META.INACTIVE;
  const isBusy = isSubmitting || uploadingCount > 0 || deletingIds.size > 0;

  // 카테고리 경로 레이블 빌더
  const catPath = [
    categories.depth0.find((c) => c.id === categorySelection.depth0Id)?.name,
    categories.depth1.find((c) => c.id === categorySelection.depth1Id)?.name,
    categories.depth2.find((c) => c.id === categorySelection.depth2Id)?.name,
  ].filter(Boolean).join(" > ");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 헤더 바 */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
              onClick={() => navigate("/seller/products")}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              상품 목록
            </button>
            <span className="text-gray-300">/</span>
            <span className="truncate text-sm font-semibold text-gray-800">{form.title || "상품 수정"}</span>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusMeta.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* 상품 요약 카드 */}
        <div className="mb-5 flex items-center gap-4 overflow-hidden rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
            {thumbnailImage?.url ? (
              <img src={thumbnailImage.url} alt={form.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-black text-gray-300">
                {(form.title || "P").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">{form.title || "—"}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {formatPrice(form.price || 0)}원 · 재고 {form.stockQuantity}개
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* ① 상품 이미지 */}
            <SectionCard number="1" title="상품 이미지">
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    JPG, PNG, WEBP, GIF · 파일당 최대 5MB · 최대 {MAX_IMAGE_FILES}장
                  </p>
                  <span className="text-xs font-medium text-gray-500">
                    {images.length}/{MAX_IMAGE_FILES}장
                  </span>
                </div>

                {imageError && (
                  <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                    <svg className="mt-px h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.5v4h-1.5v-4h1.5zm0 5.5v1.5h-1.5V11h1.5z" />
                    </svg>
                    {imageError}
                  </div>
                )}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
                  {images.map((img, idx) => {
                    const isDeleting = deletingIds.has(img.id);
                    const isSettingThumb = settingThumbnailId === img.id;
                    return (
                      <div key={img.id} className="flex flex-col gap-1.5">
                        {/* 이미지 카드 */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => img.url && setPreviewIdx(idx)}
                            disabled={!img.url}
                            className={[
                              "group relative h-24 w-full overflow-hidden rounded-lg bg-gray-100 ring-2 transition",
                              img.isThumbnail ? "ring-blue-500" : "ring-transparent hover:ring-gray-200",
                              img.url ? "cursor-zoom-in" : "cursor-default",
                            ].join(" ")}
                          >
                            {img.url ? (
                              <img src={img.url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">없음</div>
                            )}
                            {/* 확대 힌트 */}
                            {img.url && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                                <svg className="h-5 w-5 text-white opacity-0 drop-shadow transition group-hover:opacity-100" fill="none" viewBox="0 0 20 20">
                                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                                  <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              </div>
                            )}
                            {isDeleting && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              </div>
                            )}
                          </button>

                          {/* 대표 뱃지 */}
                          {img.isThumbnail && (
                            <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1.5 py-px text-[9px] font-bold text-white shadow">
                              대표
                            </span>
                          )}

                          {/* 삭제 버튼 */}
                          {!isDeleting && (
                            <button
                              type="button"
                              aria-label="이미지 삭제"
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white shadow transition hover:bg-red-500"
                              onClick={() => handleDeleteImage(img.id)}
                            >
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* 대표로 설정 버튼 (비대표 이미지만) */}
                        {!img.isThumbnail && !isDeleting ? (
                          <button
                            type="button"
                            onClick={() => handleSetThumbnail(img.id)}
                            disabled={!!settingThumbnailId || uploadingCount > 0}
                            className="w-full rounded border border-gray-200 bg-white py-1 text-[10px] font-medium text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isSettingThumb ? (
                              <span className="flex items-center justify-center gap-1">
                                <svg className="h-3 w-3 animate-spin" viewBox="0 0 12 12" fill="none">
                                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
                                  <path d="M6 1.5A4.5 4.5 0 0110.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                                처리중
                              </span>
                            ) : "대표로 설정"}
                          </button>
                        ) : (
                          <div className="h-[26px]" />
                        )}
                      </div>
                    );
                  })}

                  {Array.from({ length: uploadingCount }).map((_, i) => (
                    <div key={`uploading-${i}`} className="flex flex-col gap-1.5">
                      <div className="flex h-24 w-full items-center justify-center rounded-lg bg-gray-100">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                      </div>
                      <div className="h-[26px]" />
                    </div>
                  ))}

                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCount > 0 || images.length >= MAX_IMAGE_FILES}
                      className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-blue-400 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                      <span className="text-[11px] font-medium">이미지 추가</span>
                    </button>
                    <div className="h-[26px]" />
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            </SectionCard>

            {/* ② 기본 정보 */}
            <SectionCard number="2" title="기본 정보">
              <FieldRow label="상품명" required error={errors.title}>
                <input
                  id="title"
                  value={form.title}
                  onChange={handleChange("title")}
                  placeholder="상품명을 입력해 주세요"
                  disabled={isBusy}
                  maxLength={100}
                  className={[INPUT_CLASS, errors.title && "border-red-400 focus:border-red-400 focus:ring-red-100"].filter(Boolean).join(" ")}
                />
                <div className="mt-1 flex justify-end">
                  <span className="text-xs text-gray-400">{form.title.length}/100</span>
                </div>
              </FieldRow>

              <FieldRow label="상품 설명" helpText="선택 항목입니다.">
                <textarea
                  id="description"
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="상품에 대한 설명을 입력해 주세요"
                  rows={4}
                  disabled={isBusy}
                  className="w-full resize-none rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </FieldRow>
            </SectionCard>

            {/* ③ 카테고리 */}
            <SectionCard number="3" title="카테고리">
              <FieldRow label="카테고리" required error={errors.categoryId}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <select
                    id="cat-0"
                    value={categorySelection.depth0Id}
                    onChange={(e) => handleCategoryChange("depth0Id", e.target.value)}
                    disabled={isBusy}
                    className={[SELECT_CLASS, "flex-1", errors.categoryId && !categorySelection.depth0Id && "border-red-400"].filter(Boolean).join(" ")}
                  >
                    <option value="">대분류 선택</option>
                    {categories.depth0.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <svg className="hidden h-4 w-4 flex-shrink-0 text-gray-400 sm:block" fill="none" viewBox="0 0 16 16">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  <select
                    id="cat-1"
                    value={categorySelection.depth1Id}
                    onChange={(e) => handleCategoryChange("depth1Id", e.target.value)}
                    disabled={isBusy || !categorySelection.depth0Id || categories.depth1.length === 0}
                    className={[SELECT_CLASS, "flex-1"].join(" ")}
                  >
                    <option value="">{categories.depth1.length === 0 && categorySelection.depth0Id ? "중분류 없음" : "중분류 선택"}</option>
                    {categories.depth1.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <svg className="hidden h-4 w-4 flex-shrink-0 text-gray-400 sm:block" fill="none" viewBox="0 0 16 16">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  <select
                    id="cat-2"
                    value={categorySelection.depth2Id}
                    onChange={(e) => handleCategoryChange("depth2Id", e.target.value)}
                    disabled={isBusy || !categorySelection.depth1Id || categories.depth2.length === 0}
                    className={[SELECT_CLASS, "flex-1"].join(" ")}
                  >
                    <option value="">{categories.depth2.length === 0 && categorySelection.depth1Id ? "소분류 없음" : "소분류 선택"}</option>
                    {categories.depth2.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {catPath && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-2">
                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 16 16">
                      <path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs font-medium text-blue-700">{catPath}</span>
                  </div>
                )}
              </FieldRow>
            </SectionCard>

            {/* ④ 판매 조건 */}
            <SectionCard number="4" title="판매 조건">
              <FieldRow label="판매가" required error={errors.price} helpText="최소 1,000원 이상">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      id="price"
                      type="number"
                      value={form.price}
                      onChange={handleChange("price")}
                      placeholder="1000"
                      min={MIN_PRICE}
                      disabled={isBusy}
                      className={[INPUT_CLASS, "pr-8", errors.price && "border-red-400 focus:border-red-400 focus:ring-red-100"].filter(Boolean).join(" ")}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">원</span>
                  </div>
                  {form.price && !errors.price && (
                    <span className="flex-shrink-0 rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                      {formatPrice(form.price)}원
                    </span>
                  )}
                </div>
              </FieldRow>

              <FieldRow label="재고 수량" required error={errors.stockQuantity}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, stockQuantity: Math.max(MIN_STOCK, Number(prev.stockQuantity) - 1) }))
                    }
                    disabled={isBusy || Number(form.stockQuantity) <= MIN_STOCK}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-lg font-bold text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <input
                    id="stock"
                    type="number"
                    value={form.stockQuantity}
                    onChange={handleChange("stockQuantity")}
                    min={MIN_STOCK}
                    disabled={isBusy}
                    className={[
                      "h-11 w-24 rounded border border-gray-300 bg-white text-center text-sm font-bold text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50",
                      errors.stockQuantity && "border-red-400 focus:border-red-400 focus:ring-red-100",
                    ].filter(Boolean).join(" ")}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, stockQuantity: Number(prev.stockQuantity) + 1 }))
                    }
                    disabled={isBusy}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-lg font-bold text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500">개</span>
                </div>
              </FieldRow>
            </SectionCard>
          </div>

          {/* 하단 고정 액션 바 */}
          <div className="sticky bottom-0 mt-4">
            <div className="border-t border-gray-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
              <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">
                {submitError && (
                  <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 4.5v4h-1.5v-4h1.5zm0 5.5v1.5h-1.5V11h1.5z" />
                    </svg>
                    {submitError}
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    disabled={isBusy}
                    onClick={() => navigate("/seller/products")}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    size="md"
                    disabled={isBusy}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        저장 중...
                      </span>
                    ) : "수정 완료"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Modal
        open={imageLimitModal.open}
        onClose={() => setImageLimitModal((prev) => ({ ...prev, open: false }))}
        title={imageLimitModal.title}
        description={imageLimitModal.description}
        footer={
          <Button type="button" onClick={() => setImageLimitModal((prev) => ({ ...prev, open: false }))}>
            확인
          </Button>
        }
      />

      {/* 이미지 라이트박스 */}
      {previewIdx !== null && images[previewIdx]?.url && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setPreviewIdx(null)}
        >
          {/* 이전 버튼 */}
          {previewIdx > 0 && (
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={(e) => { e.stopPropagation(); setPreviewIdx((i) => i - 1); }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* 이미지 */}
          <img
            src={images[previewIdx].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* 다음 버튼 */}
          {previewIdx < images.length - 1 && (
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={(e) => { e.stopPropagation(); setPreviewIdx((i) => i + 1); }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* 닫기 버튼 */}
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setPreviewIdx(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* 카운터 + 대표 여부 */}
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-xs font-medium text-white">
            <span>{previewIdx + 1} / {images.length}</span>
            {images[previewIdx].isThumbnail && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-blue-300">대표 이미지</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
