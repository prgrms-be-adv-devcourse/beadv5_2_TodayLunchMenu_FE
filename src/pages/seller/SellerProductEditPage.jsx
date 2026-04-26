import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import PageContainer from "../../components/common/PageContainer";
import {
  deleteProductImageApi,
  getCategoriesApi,
  getChildCategoriesApi,
  getProductDetailApi,
  updateProductApi,
  uploadProductImageApi,
} from "../../features/product/productApi";

const MIN_PRICE = 1000;
const MIN_STOCK = 0;
const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_FILES = 5;

const STATUS_META = {
  ACTIVE:   { label: "판매중", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  SOLD_OUT: { label: "품절",   className: "bg-red-50 text-red-600 border border-red-200" },
  INACTIVE: { label: "비공개", className: "bg-gray-100 text-gray-500 border border-gray-200" },
};

const SELECT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100";

function formatPrice(v) {
  return new Intl.NumberFormat("ko-KR").format(v);
}

export default function SellerProductEditPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [productStatus, setProductStatus] = useState(null);
  const [images, setImages] = useState([]);       // { id, url, isThumbnail }
  const [uploadingCount, setUploadingCount] = useState(0);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [imageError, setImageError] = useState("");
  const [imageLimitModal, setImageLimitModal] = useState({
    open: false,
    title: "",
    description: "",
  });

  const openImageLimitModal = (title, description) => {
    setImageLimitModal({
      open: true,
      title,
      description,
    });
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stockQuantity: 0,
    categoryId: "",
  });
  const [categorySelection, setCategorySelection] = useState({
    depth0Id: "", depth1Id: "", depth2Id: "",
  });
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
            if (!cancelled && depth2.length > 0) {
              setCategories((prev) => ({ ...prev, depth2 }));
            }
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

  // ── 이미지 업로드 ──────────────────────────────────────────
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    setImageError("");

    if (images.length >= MAX_IMAGE_FILES) {
      setImageError(`상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.`);
      openImageLimitModal(
        "이미지 개수 제한",
        `상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.`
      );
      return;
    }

    const remainingSlots = MAX_IMAGE_FILES - images.length;
    const nextFiles = files.slice(0, remainingSlots);

    const oversizedFile = nextFiles.find((file) => file.size > MAX_IMAGE_FILE_SIZE);
    if (oversizedFile) {
      setImageError("이미지 파일은 각각 5MB 이하여야 합니다.");
      openImageLimitModal(
        "이미지 용량 초과",
        "이미지 파일은 파일당 최대 5MB까지 업로드할 수 있습니다. 파일 크기를 줄인 뒤 다시 시도해 주세요."
      );
      return;
    }

    if (files.length > remainingSlots) {
      setImageError(`상품 이미지는 최대 ${MAX_IMAGE_FILES}장까지 등록할 수 있습니다.`);
      openImageLimitModal(
        "이미지 개수 제한",
        `최대 ${MAX_IMAGE_FILES}장까지만 등록할 수 있어 선택한 이미지 중 일부만 업로드됩니다.`
      );
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

    const succeeded = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failCount = results.filter((r) => r.status === "rejected").length;

    if (succeeded.length > 0) setImages((prev) => [...prev, ...succeeded]);
    if (failCount > 0) setImageError(`${failCount}개 이미지 업로드에 실패했습니다.`);
  };

  // ── 이미지 삭제 ──────────────────────────────────────────
  const handleDeleteImage = async (imageId) => {
    setDeletingIds((prev) => new Set(prev).add(imageId));
    setImageError("");
    try {
      await deleteProductImageApi(productId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setImageError(err instanceof ApiError ? err.message : "이미지 삭제에 실패했습니다.");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  // ── 폼 핸들러 ──────────────────────────────────────────
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
      setForm((prev) => ({
        ...prev,
        categoryId: nextId || categorySelection.depth1Id || categorySelection.depth0Id,
      }));
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
    else if (!Number.isInteger(stockNum) || stockNum < MIN_STOCK)
      next.stockQuantity = "재고는 0 이상의 정수여야 합니다.";
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

  // ── 로딩 / 에러 ──────────────────────────────────────────
  if (pageLoading) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-gray-400">상품 정보를 불러오는 중...</p>
      </PageContainer>
    );
  }

  if (pageError) {
    return (
      <PageContainer>
        <p className="py-16 text-center text-sm text-red-500">{pageError}</p>
        <button
          type="button"
          className="mt-2 w-full text-center text-sm text-violet-600 underline underline-offset-2"
          onClick={() => navigate("/seller/products")}
        >
          목록으로 돌아가기
        </button>
      </PageContainer>
    );
  }

  const thumbnailImage = images.find((img) => img.isThumbnail) || images[0] || null;
  const statusMeta = STATUS_META[productStatus] ?? STATUS_META.INACTIVE;
  const isBusy = isSubmitting || uploadingCount > 0 || deletingIds.size > 0;

  return (
    <PageContainer>
      {/* 뒤로가기 */}
      <button
        type="button"
        className="mb-4 flex items-center gap-1 text-sm text-gray-400 transition hover:text-gray-700"
        onClick={() => navigate("/seller/products")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        상품 목록
      </button>

      {/* 대표 이미지 (크게) */}
      <div className="mb-4 overflow-hidden rounded-2xl bg-gray-50">
        {thumbnailImage?.url ? (
          <img
            src={thumbnailImage.url}
            alt={form.title}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center text-6xl font-black text-gray-200">
            {(form.title || "P").slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      {/* 상품 현황 스트립 */}
      <div className="mb-6 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
        <div className="min-w-0">
          <p className="truncate font-bold text-gray-900">{form.title || "—"}</p>
          <p className="text-sm font-semibold text-violet-700">{formatPrice(form.price || 0)}원</p>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
          <span className="text-xs text-gray-400">재고 {form.stockQuantity}개</span>
        </div>
      </div>

      {/* ── 이미지 관리 섹션 ── */}
      <section className="mb-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">상품 이미지</h3>
          <span className="text-xs text-gray-400">{images.length}장</span>
        </div>

        <p className="mb-3 text-xs text-gray-500">최대 5장까지 등록할 수 있으며, JPG, PNG, WEBP, GIF 파일만 가능합니다. 파일당 최대 5MB까지 업로드할 수 있습니다.</p>

        {imageError && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{imageError}</p>
        )}

        <div className="flex gap-3 overflow-x-auto pb-1">
          {/* 기존 이미지 */}
          {images.map((img) => {
            const isDeleting = deletingIds.has(img.id);
            return (
              <div key={img.id} className="relative flex-shrink-0">
                <div
                  className={[
                    "h-24 w-24 overflow-hidden rounded-xl bg-gray-50 ring-2 transition",
                    img.isThumbnail ? "ring-violet-400" : "ring-transparent",
                  ].join(" ")}
                >
                  {img.url ? (
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs">
                      없음
                    </div>
                  )}
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                {img.isThumbnail && (
                  <span className="absolute bottom-1 left-1 rounded bg-violet-600 px-1 py-px text-[9px] font-bold text-white">
                    대표
                  </span>
                )}
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
            );
          })}

          {/* 업로드 중 스켈레톤 */}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100"
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            </div>
          ))}

          {/* 추가 버튼 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCount > 0 || images.length >= MAX_IMAGE_FILES}
            className="flex h-24 w-24 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-violet-300 hover:text-violet-500 disabled:opacity-40"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[11px] font-medium">추가</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* ── 정보 수정 폼 ── */}
      <h2 className="mb-4 text-base font-extrabold text-gray-800">상품 정보 수정</h2>

      {submitError && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{submitError}</div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">기본 정보</h3>

          <FormField label="상품명" htmlFor="title" required error={errors.title}>
            <Input
              id="title"
              value={form.title}
              onChange={handleChange("title")}
              placeholder="상품명을 입력해 주세요"
              disabled={isBusy}
            />
          </FormField>

          <FormField label="상품 설명" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              value={form.description}
              onChange={handleChange("description")}
              placeholder="상품에 대한 설명을 입력해 주세요 (선택)"
              rows={4}
              disabled={isBusy}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
            />
          </FormField>
        </section>

        {/* 카테고리 */}
        <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">카테고리</h3>

          <FormField label="대분류" htmlFor="cat-0" required error={errors.categoryId}>
            <select
              id="cat-0"
              value={categorySelection.depth0Id}
              onChange={(e) => handleCategoryChange("depth0Id", e.target.value)}
              disabled={isBusy}
              className={SELECT_CLASS}
            >
              <option value="">대분류 선택</option>
              {categories.depth0.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          {categories.depth1.length > 0 && (
            <FormField label="중분류" htmlFor="cat-1">
              <select
                id="cat-1"
                value={categorySelection.depth1Id}
                onChange={(e) => handleCategoryChange("depth1Id", e.target.value)}
                disabled={isBusy}
                className={SELECT_CLASS}
              >
                <option value="">중분류 선택</option>
                {categories.depth1.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
          )}

          {categories.depth2.length > 0 && (
            <FormField label="소분류" htmlFor="cat-2">
              <select
                id="cat-2"
                value={categorySelection.depth2Id}
                onChange={(e) => handleCategoryChange("depth2Id", e.target.value)}
                disabled={isBusy}
                className={SELECT_CLASS}
              >
                <option value="">소분류 선택</option>
                {categories.depth2.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>
          )}
        </section>

        {/* 판매 조건 */}
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">판매 조건</h3>

          <FormField label="판매가 (원)" htmlFor="price" required error={errors.price}>
            <Input
              id="price"
              type="number"
              value={form.price}
              onChange={handleChange("price")}
              placeholder="1,000원 이상"
              min={MIN_PRICE}
              disabled={isBusy}
            />
          </FormField>

          <FormField label="재고 수량" htmlFor="stock" required error={errors.stockQuantity}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    stockQuantity: Math.max(MIN_STOCK, Number(prev.stockQuantity) - 1),
                  }))
                }
                disabled={isBusy || Number(form.stockQuantity) <= MIN_STOCK}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold text-gray-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-40"
              >
                −
              </button>
              <Input
                id="stock"
                type="number"
                value={form.stockQuantity}
                onChange={handleChange("stockQuantity")}
                min={MIN_STOCK}
                disabled={isBusy}
                className="text-center"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    stockQuantity: Number(prev.stockQuantity) + 1,
                  }))
                }
                disabled={isBusy}
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold text-gray-600 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </FormField>
        </section>

        {/* 액션 버튼 */}
        <div className="flex gap-3 pb-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="flex-1"
            disabled={isBusy}
            onClick={() => navigate("/seller/products")}
          >
            취소
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={isBusy}>
            {isSubmitting ? "저장 중..." : "수정 완료"}
          </Button>
        </div>
      </form>

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
    </PageContainer>
  );
}
