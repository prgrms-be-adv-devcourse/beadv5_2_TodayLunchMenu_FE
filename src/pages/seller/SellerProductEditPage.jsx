import { useEffect, useMemo, useRef, useState } from "react";
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
import { useRequireRole } from "../../features/auth/useRequireRole";

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
  useRequireRole("SELLER");
  const { productId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [productStatus, setProductStatus] = useState(null);
  // 서버에서 받은 기존 이미지
  const [serverImages, setServerImages] = useState([]);
  // 새로 추가된 이미지 (수정 완료 시 일괄 업로드)
  // [{ tempId, file, previewUrl, sortOrder }]
  const [pendingUploads, setPendingUploads] = useState([]);
  // 삭제 마킹된 서버 이미지 id Set (수정 완료 시 일괄 삭제)
  const [pendingDeletes, setPendingDeletes] = useState(() => new Set());
  // 변경된 썸네일 id (서버 id 또는 stage tempId, null이면 변경 없음)
  const [pendingThumbnailId, setPendingThumbnailId] = useState(null);
  const [previewIdx, setPreviewIdx] = useState(null);
  const [imageError, setImageError] = useState("");
  const [imageLimitModal, setImageLimitModal] = useState({ open: false, title: "", description: "" });

  const [form, setForm] = useState({
    title: "", description: "", price: "", stockQuantity: 0, categoryId: "",
  });
  const [categorySelection, setCategorySelection] = useState({ depth0Id: "", depth1Id: "" });
  const [categories, setCategories] = useState({ depth0: [], depth1: [] });
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
        const [product, depth0Cats] = await Promise.all([
          getProductDetailApi(productId),
          getCategoriesApi({ depth: 0 }),
        ]);
        if (cancelled) return;
        setProductStatus(product.status);
        setServerImages(product.images ?? []);
        const isDefaultDesc = product.description === "상품 설명이 아직 등록되지 않았습니다.";
        setForm({
          title: product.name,
          description: isDefaultDesc ? "" : (product.description || ""),
          price: String(product.price),
          stockQuantity: product.stockCount,
          categoryId: product.categoryId || "",
        });
        setCategories({ depth0: depth0Cats, depth1: [] });
        if (!product.categoryId) return;

        // 상품 categoryId가 depth0인 경우
        if (depth0Cats.some((c) => c.id === product.categoryId)) {
          const depth1 = await getChildCategoriesApi(product.categoryId);
          if (!cancelled) {
            setCategorySelection({ depth0Id: product.categoryId, depth1Id: "" });
            setCategories({ depth0: depth0Cats, depth1 });
          }
          return;
        }

        // 상품 categoryId가 depth1인 경우 — 부모 depth0를 찾을 때까지 순회
        for (const d0 of depth0Cats) {
          if (cancelled) return;
          const children = await getChildCategoriesApi(d0.id);
          if (cancelled) return;
          if (children.some((c) => c.id === product.categoryId)) {
            setCategorySelection({ depth0Id: d0.id, depth1Id: product.categoryId });
            setCategories({ depth0: depth0Cats, depth1: children });
            return;
          }
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

  // 표시용 통합 이미지 리스트 (수정 완료 전엔 모두 미반영 상태)
  // - 서버 이미지 중 pendingDeletes에 없는 것 + pendingUploads의 stage 이미지
  // - 각 항목은 { id 또는 tempId, url, isThumbnail, isStage }
  const displayImages = useMemo(() => {
    const remainingServer = serverImages
      .filter((img) => !pendingDeletes.has(img.id))
      .map((img) => ({
        key: `srv-${img.id}`,
        id: img.id,
        url: img.url,
        isStage: false,
        isThumbnail:
          pendingThumbnailId != null
            ? pendingThumbnailId === img.id
            : !!img.isThumbnail,
      }));
    const stageList = pendingUploads.map((p) => ({
      key: `tmp-${p.tempId}`,
      tempId: p.tempId,
      url: p.previewUrl,
      isStage: true,
      isThumbnail: pendingThumbnailId === p.tempId,
    }));
    return [...remainingServer, ...stageList];
  }, [serverImages, pendingDeletes, pendingUploads, pendingThumbnailId]);

  // pendingUploads의 previewUrl 페이지 이탈 시 정리
  useEffect(() => {
    return () => {
      pendingUploads.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    setImageError("");
    if (displayImages.length >= MAX_IMAGE_FILES) {
      setImageError(`상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.`);
      setImageLimitModal({ open: true, title: "이미지 개수 제한", description: `상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.` });
      return;
    }
    const remainingSlots = MAX_IMAGE_FILES - displayImages.length;
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
    const baseSortOrder = displayImages.length;
    const stageItems = nextFiles.map((file, idx) => ({
      tempId: `tmp_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      sortOrder: baseSortOrder + idx,
    }));
    setPendingUploads((prev) => [...prev, ...stageItems]);
  };

  // imageId(서버 id) 또는 tempId(stage) 모두 받아서 처리
  const handleDeleteImage = (idOrTempId) => {
    setImageError("");
    // stage 이미지인지 확인
    const stage = pendingUploads.find((p) => p.tempId === idOrTempId);
    if (stage) {
      URL.revokeObjectURL(stage.previewUrl);
      setPendingUploads((prev) => prev.filter((p) => p.tempId !== idOrTempId));
      if (pendingThumbnailId === idOrTempId) setPendingThumbnailId(null);
      return;
    }
    // 서버 이미지면 삭제 마킹
    setPendingDeletes((prev) => {
      const next = new Set(prev);
      next.add(idOrTempId);
      return next;
    });
    if (pendingThumbnailId === idOrTempId) setPendingThumbnailId(null);
  };

  const handleSetThumbnail = (idOrTempId) => {
    setImageError("");
    setPendingThumbnailId(idOrTempId);
  };

  // 라이트박스 키보드 탐색
  useEffect(() => {
    if (previewIdx === null) return;
    const onKey = (e) => {
      if (e.key === "Escape") setPreviewIdx(null);
      else if (e.key === "ArrowRight") setPreviewIdx((i) => (i < displayImages.length - 1 ? i + 1 : i));
      else if (e.key === "ArrowLeft") setPreviewIdx((i) => (i > 0 ? i - 1 : i));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewIdx, displayImages.length]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSubmitError("");
  };

  const handleCategoryChange = async (depthKey, nextId) => {
    setErrors((prev) => ({ ...prev, categoryId: "" }));
    setSubmitError("");
    if (depthKey === "depth0Id") {
      setCategorySelection({ depth0Id: nextId, depth1Id: "" });
      setCategories((prev) => ({ ...prev, depth1: [] }));
      setForm((prev) => ({ ...prev, categoryId: nextId }));
      if (!nextId) return;
      const depth1 = await getChildCategoriesApi(nextId);
      setCategories((prev) => ({ ...prev, depth1 }));
    } else if (depthKey === "depth1Id") {
      setCategorySelection((prev) => ({ ...prev, depth1Id: nextId }));
      setForm((prev) => ({ ...prev, categoryId: nextId || categorySelection.depth0Id }));
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
      setImageError("");

      // 1) 신규 이미지 업로드
      const tempIdToServerId = new Map();
      for (const pending of pendingUploads) {
        const result = await uploadProductImageApi(productId, pending.file, {
          sortOrder: pending.sortOrder,
          isThumbnail: false, // 썸네일 처리는 마지막에 일괄
        });
        tempIdToServerId.set(pending.tempId, result?.id ?? result?.imageId ?? null);
      }

      // 2) 삭제 마킹된 서버 이미지 삭제
      for (const id of pendingDeletes) {
        await deleteProductImageApi(productId, id);
      }

      // 3) 썸네일 변경 처리 (stage tempId면 새로 받은 서버 id로 매핑)
      if (pendingThumbnailId != null) {
        const realId = tempIdToServerId.has(pendingThumbnailId)
          ? tempIdToServerId.get(pendingThumbnailId)
          : pendingThumbnailId;
        if (realId != null) {
          await setImageThumbnailApi(productId, realId);
        }
      }

      // 4) 메타데이터 저장
      await updateProductApi(productId, {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categoryId: form.categoryId,
      });

      // stage previewUrl 정리
      pendingUploads.forEach((p) => URL.revokeObjectURL(p.previewUrl));
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

  const thumbnailImage = displayImages.find((img) => img.isThumbnail) || displayImages[0] || null;
  const statusMeta = STATUS_META[productStatus] ?? STATUS_META.INACTIVE;
  const isBusy = isSubmitting;

  // 카테고리 경로 레이블 빌더
  const catPath = [
    categories.depth0.find((c) => c.id === categorySelection.depth0Id)?.name,
    categories.depth1.find((c) => c.id === categorySelection.depth1Id)?.name,
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
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-300">
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
                    {displayImages.length}/{MAX_IMAGE_FILES}장
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
                  {displayImages.map((img, idx) => {
                    const itemKey = img.key;
                    const itemId = img.id ?? img.tempId;
                    return (
                      <div key={itemKey} className="flex flex-col gap-1.5">
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
                          </button>

                          {/* 대표 뱃지 */}
                          {img.isThumbnail && (
                            <span className="absolute bottom-1 left-1 rounded bg-blue-600 px-1.5 py-px text-[9px] font-bold text-white shadow">
                              대표
                            </span>
                          )}

                          {/* 신규 stage 뱃지 */}
                          {img.isStage && (
                            <span className="absolute bottom-1 right-1 rounded bg-emerald-500 px-1.5 py-px text-[9px] font-bold text-white shadow">
                              신규
                            </span>
                          )}

                          {/* 삭제 버튼 */}
                          <button
                            type="button"
                            aria-label="이미지 삭제"
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white shadow transition hover:bg-red-500"
                            onClick={() => handleDeleteImage(itemId)}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>

                        {/* 대표로 설정 버튼 (비대표 이미지만) */}
                        {!img.isThumbnail ? (
                          <button
                            type="button"
                            onClick={() => handleSetThumbnail(itemId)}
                            className="w-full rounded border border-gray-200 bg-white py-1 text-[10px] font-medium text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                          >
                            대표로 설정
                          </button>
                        ) : (
                          <div className="h-[26px]" />
                        )}
                      </div>
                    );
                  })}

                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={displayImages.length >= MAX_IMAGE_FILES}
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
      {previewIdx !== null && displayImages[previewIdx]?.url && (
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
            src={displayImages[previewIdx].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* 다음 버튼 */}
          {previewIdx < displayImages.length - 1 && (
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
            <span>{previewIdx + 1} / {displayImages.length}</span>
            {displayImages[previewIdx].isThumbnail && (
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
