import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Input from "../../components/common/Input";
import PageContainer from "../../components/common/PageContainer";
import AiProductDraftAssistant from "../../components/seller/AiProductDraftAssistant";
import SellerProductForm from "../../components/seller/SellerProductForm";
import { createProductDraftFromImageApi } from "../../features/ai/aiProductDraftApi";
import { createAuctionApi } from "../../features/auction/auctionApi";
import {
  createProductApi,
  getCategoriesApi,
  getChildCategoriesApi,
} from "../../features/product/productApi";

const MIN_PRICE = 1000;
const MIN_STOCK = 1;
const MAX_IMAGE_FILES = 10;
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const AI_MAX_IMAGE_FILES = 5;
const AI_MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const IMAGE_CONSTRAINTS = {
  maxFiles: MAX_IMAGE_FILES,
  maxFileSizeLabel: "10MB",
  acceptedTypesLabel: "JPG, PNG, WEBP, GIF",
  accept: "image/jpeg,image/png,image/webp,image/gif",
};

const revokePreviewUrls = (images) => {
  images.forEach((image) => {
    if (image?.previewUrl) {
      URL.revokeObjectURL(image.previewUrl);
    }
  });
};

const toImageItem = (file) => ({
  file,
  previewUrl: URL.createObjectURL(file),
});

function findCategoryName(categories, categoryId) {
  if (!categoryId) {
    return "";
  }

  const allCategories = [
    ...categories.depth0,
    ...categories.depth1,
    ...categories.depth2,
  ];
  const category = allCategories.find((item) => item.id === categoryId);

  return category?.name ?? "";
}

function getCategoryPathText(categories, categorySelection) {
  return [
    findCategoryName(categories, categorySelection.depth0Id),
    findCategoryName(categories, categorySelection.depth1Id),
    findCategoryName(categories, categorySelection.depth2Id),
  ]
    .filter(Boolean)
    .join(" > ");
}

export default function SellerProductCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    type: "GENERAL",
    title: "",
    categoryId: "",
    stockQuantity: MIN_STOCK,
    price: "",
    description: "",
    images: [],
    thumbnailIndex: 0,
  });
  const [categorySelection, setCategorySelection] = useState({
    depth0Id: "",
    depth1Id: "",
    depth2Id: "",
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState({
    depth0: [],
    depth1: [],
    depth2: [],
  });
  const [categoriesLoading, setCategoriesLoading] = useState({
    depth0: true,
    depth1: false,
    depth2: false,
  });
  const [categoryError, setCategoryError] = useState("");
  const [categoryNotice, setCategoryNotice] = useState("");
  const [auctionForm, setAuctionForm] = useState({
    startPrice: "",
    bidUnit: "",
    startedAt: "",
    durationMinutes: "",
  });
  const [auctionErrors, setAuctionErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiDraft, setAiDraft] = useState(null);
  const [aiDraftError, setAiDraftError] = useState("");
  const [isCreatingAiDraft, setIsCreatingAiDraft] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRootCategories() {
      try {
        setCategoriesLoading((prev) => ({ ...prev, depth0: true }));
        setCategoryError("");
        setCategoryNotice("");
        const data = await getCategoriesApi({ depth: 0 });

        if (cancelled) {
          return;
        }

        setCategories((prev) => ({ ...prev, depth0: data }));

        if (data.length === 0) {
          setCategoryNotice(
            "등록된 대분류 카테고리가 없습니다. 관리자에게 문의해 주세요."
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCategories((prev) => ({ ...prev, depth0: [] }));
        setCategoryError(error?.message || "카테고리 목록을 불러오지 못했습니다.");
        setCategoryNotice(
          "카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
      } finally {
        if (!cancelled) {
          setCategoriesLoading((prev) => ({ ...prev, depth0: false }));
        }
      }
    }

    loadRootCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrls(form.images);
    };
  }, [form.images]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setSubmitError("");
  };

  const handleIncreaseStock = () => {
    setForm((prev) => ({
      ...prev,
      stockQuantity: Number(prev.stockQuantity || 0) + 1,
    }));
  };

  const handleDecreaseStock = () => {
    setForm((prev) => ({
      ...prev,
      stockQuantity: Math.max(MIN_STOCK, Number(prev.stockQuantity || 0) - 1),
    }));
  };

  const handleAuctionChange = (key) => (event) => {
    setAuctionForm((prev) => ({ ...prev, [key]: event.target.value }));
    setAuctionErrors((prev) => ({ ...prev, [key]: "" }));
    setSubmitError("");
  };

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    setAiDraft(null);
    setAiDraftError("");

    const invalidTypeFile = files.find(
      (file) => !ACCEPTED_IMAGE_TYPES.includes(file.type)
    );
    if (invalidTypeFile) {
      setErrors((prev) => ({
        ...prev,
        images: "JPG, PNG, WEBP, GIF 형식의 이미지 파일만 업로드할 수 있습니다.",
      }));
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_FILE_SIZE);
    if (oversizedFile) {
      setErrors((prev) => ({
        ...prev,
        images: "이미지 파일은 각각 10MB 이하여야 합니다.",
      }));
      return;
    }

    setForm((prev) => {
      const remainingSlots = MAX_IMAGE_FILES - prev.images.length;

      if (remainingSlots <= 0) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          images: `이미지는 최대 ${MAX_IMAGE_FILES}개까지 업로드할 수 있습니다.`,
        }));
        return prev;
      }

      const nextFiles = files.slice(0, remainingSlots);
      const nextImages = [...prev.images, ...nextFiles.map(toImageItem)];

      if (files.length > remainingSlots) {
        setErrors((currentErrors) => ({
          ...currentErrors,
          images: `이미지는 최대 ${MAX_IMAGE_FILES}개까지 업로드할 수 있습니다.`,
        }));
      } else {
        setErrors((currentErrors) => ({ ...currentErrors, images: "" }));
      }

      setSubmitError("");

      return {
        ...prev,
        images: nextImages,
        thumbnailIndex:
          nextImages.length === 0
            ? 0
            : Math.min(prev.thumbnailIndex, nextImages.length - 1),
      };
    });
  };

  const handleThumbnailSelect = (index) => {
    setForm((prev) => ({ ...prev, thumbnailIndex: index }));
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => {
      const targetImage = prev.images[index];
      if (targetImage?.previewUrl) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      const nextImages = prev.images.filter(
        (_, currentIndex) => currentIndex !== index
      );
      let nextThumbnailIndex = prev.thumbnailIndex;

      if (nextImages.length === 0) {
        nextThumbnailIndex = 0;
      } else if (index === prev.thumbnailIndex) {
        nextThumbnailIndex = 0;
      } else if (index < prev.thumbnailIndex) {
        nextThumbnailIndex = prev.thumbnailIndex - 1;
      }

      return {
        ...prev,
        images: nextImages,
        thumbnailIndex: nextThumbnailIndex,
      };
    });
  };

  const loadChildCategories = async (parentId, depthKey) => {
    try {
      const children = await getChildCategoriesApi(parentId);
      setCategories((prev) => ({ ...prev, [depthKey]: children }));

      if (children.length === 0) {
        setCategoryNotice(
          "선택한 상위 카테고리에 연결된 하위 카테고리가 없습니다."
        );
      } else {
        setCategoryNotice("");
      }
    } catch (error) {
      setCategories((prev) => ({ ...prev, [depthKey]: [] }));
      setCategoryError(error?.message || "하위 카테고리를 불러오지 못했습니다.");
    }
  };

  const handleCategoryChange = async (depthKey, nextCategoryId) => {
    setSubmitError("");
    setErrors((prev) => ({ ...prev, categoryId: "" }));
    setCategoryError("");
    setCategoryNotice("");

    if (depthKey === "depth0Id") {
      setCategorySelection({
        depth0Id: nextCategoryId,
        depth1Id: "",
        depth2Id: "",
      });
      setCategories((prev) => ({ ...prev, depth1: [], depth2: [] }));
      setForm((prev) => ({ ...prev, categoryId: nextCategoryId }));

      if (!nextCategoryId) {
        return;
      }

      setCategoriesLoading((prev) => ({
        ...prev,
        depth1: true,
        depth2: false,
      }));
      await loadChildCategories(nextCategoryId, "depth1");
      setCategoriesLoading((prev) => ({
        ...prev,
        depth1: false,
        depth2: false,
      }));
      return;
    }

    if (depthKey === "depth1Id") {
      setCategorySelection((prev) => ({
        ...prev,
        depth1Id: nextCategoryId,
        depth2Id: "",
      }));
      setCategories((prev) => ({ ...prev, depth2: [] }));
      setForm((prev) => ({
        ...prev,
        categoryId: nextCategoryId || categorySelection.depth0Id,
      }));

      if (!nextCategoryId) {
        return;
      }

      setCategoriesLoading((prev) => ({ ...prev, depth2: true }));
      await loadChildCategories(nextCategoryId, "depth2");
      setCategoriesLoading((prev) => ({ ...prev, depth2: false }));
      return;
    }

    if (depthKey === "depth2Id") {
      setCategorySelection((prev) => ({ ...prev, depth2Id: nextCategoryId }));
      setForm((prev) => ({
        ...prev,
        categoryId:
          nextCategoryId ||
          categorySelection.depth1Id ||
          categorySelection.depth0Id,
      }));
    }
  };

  const validate = () => {
    const next = {};

    if (form.type !== "GENERAL" && form.type !== "AUCTION") {
      next.type = "상품 유형을 선택해 주세요.";
    }

    if (!form.title.trim()) {
      next.title = "상품명을 입력해 주세요.";
    }

    if (!form.categoryId) {
      next.categoryId = "대분류 카테고리를 선택해 주세요.";
    }

    if (form.type !== "AUCTION") {
      const priceText = String(form.price).trim();
      const priceNumber = Number(priceText);
      if (!priceText) {
        next.price = "가격을 입력해 주세요.";
      } else if (!Number.isInteger(priceNumber)) {
        next.price = "가격은 정수로 입력해 주세요.";
      } else if (priceNumber < MIN_PRICE) {
        next.price = `가격은 ${MIN_PRICE.toLocaleString()}원 이상이어야 합니다.`;
      }

      const stockNumber = Number(form.stockQuantity);
      if (
        form.stockQuantity === "" ||
        form.stockQuantity === null ||
        form.stockQuantity === undefined
      ) {
        next.stockQuantity = "재고를 입력해 주세요.";
      } else if (!Number.isInteger(stockNumber)) {
        next.stockQuantity = "재고는 정수로 입력해 주세요.";
      } else if (stockNumber < MIN_STOCK) {
        next.stockQuantity = `재고는 ${MIN_STOCK} 이상이어야 합니다.`;
      }
    }

    const auctionNext = {};
    if (form.type === "AUCTION") {
      const sp = Number(auctionForm.startPrice);
      if (!auctionForm.startPrice || Number.isNaN(sp) || sp < 1000) {
        auctionNext.startPrice = "시작가는 1,000원 이상이어야 합니다.";
      }
      const bu = Number(auctionForm.bidUnit);
      if (!auctionForm.bidUnit || Number.isNaN(bu) || bu < 100) {
        auctionNext.bidUnit = "입찰 단위는 100원 이상이어야 합니다.";
      }
      if (!auctionForm.startedAt) {
        auctionNext.startedAt = "경매 시작 시간을 입력해 주세요.";
      }
      const dm = Number(auctionForm.durationMinutes);
      if (!auctionForm.durationMinutes || Number.isNaN(dm) || dm < 1) {
        auctionNext.durationMinutes = "경매 기간은 1분 이상이어야 합니다.";
      }
    }

    setErrors(next);
    setAuctionErrors(auctionNext);
    return Object.keys(next).length === 0 && Object.keys(auctionNext).length === 0;
  };

  const handleCreateAiDraft = async () => {
    if (form.images.length === 0) {
      setAiDraftError("이미지를 먼저 등록하면 AI가 상품 정보를 제안할 수 있어요.");
      return;
    }

    const aiImages = form.images.slice(0, AI_MAX_IMAGE_FILES);
    const oversizedAiImage = aiImages.find(
      (image) => image.file.size > AI_MAX_IMAGE_FILE_SIZE
    );

    if (oversizedAiImage) {
      setAiDraftError("AI 분석에는 파일당 5MB 이하 이미지만 사용할 수 있습니다.");
      return;
    }

    try {
      setIsCreatingAiDraft(true);
      setAiDraftError("");

      const categoryName = findCategoryName(categories, form.categoryId);
      const categoryPathText = getCategoryPathText(
        categories,
        categorySelection
      );
      const thumbnailIndex =
        form.thumbnailIndex < aiImages.length ? form.thumbnailIndex : 0;

      const draft = await createProductDraftFromImageApi({
        images: aiImages,
        inputFields: [
          {
            fieldKey: "TITLE",
            fieldLabel: "상품명",
            maxLength: 60,
            currentValue: form.title,
          },
          {
            fieldKey: "DESCRIPTION",
            fieldLabel: "상품 설명",
            maxLength: 1000,
            currentValue: form.description,
          },
          {
            fieldKey: "PRICE",
            fieldLabel: "판매가",
            maxLength: 10,
            currentValue: String(form.price ?? ""),
          },
        ],
        titleDraft: form.title,
        descriptionDraft: form.description,
        priceDraft: String(form.price ?? ""),
        categoryName,
        categoryPathText,
        thumbnailIndex,
      });

      setAiDraft(draft);
    } catch (error) {
      setAiDraftError(
        error instanceof ApiError
          ? error.message
          : "AI가 상품 초안을 만들지 못했습니다."
      );
    } finally {
      setIsCreatingAiDraft(false);
    }
  };

  const handleApplyAiDraft = () => {
    if (!aiDraft) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      title: aiDraft.suggestedTitle || prev.title,
      description: aiDraft.suggestedDescription || prev.description,
      price: aiDraft.suggestedPrice || prev.price,
    }));
    setErrors((prev) => ({
      ...prev,
      title: "",
      description: "",
      price: "",
    }));
    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const isAuction = form.type === "AUCTION";
      const product = await createProductApi({
        title: form.title.trim(),
        description: form.description.trim(),
        price: isAuction ? Number(auctionForm.startPrice) : Number(form.price),
        stockQuantity: isAuction ? 1 : Number(form.stockQuantity),
        categoryId: form.categoryId,
        type: form.type,
        images: form.images,
        thumbnailIndex: form.thumbnailIndex,
      });

      if (form.type === "AUCTION") {
        await createAuctionApi({
          productId: product.id,
          productTitle: product.name,
          startPrice: Number(auctionForm.startPrice),
          bidUnit: Number(auctionForm.bidUnit),
          startedAt: new Date(auctionForm.startedAt).toISOString(),
          durationMinutes: Number(auctionForm.durationMinutes),
        });
      }

      navigate("/seller/products");
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "상품 등록 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
            Drafting
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
            새 상품 등록
          </h1>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">
          작성 중
        </span>
      </div>

      {categoryNotice ? (
        <section className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          {categoryNotice}
        </section>
      ) : null}

      {submitError ? (
        <section className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {submitError}
        </section>
      ) : null}

      <SellerProductForm
        form={form}
        errors={errors}
        categorySelection={categorySelection}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoryError={categoryError}
        imageConstraints={IMAGE_CONSTRAINTS}
        onChange={handleChange}
        onCategoryChange={handleCategoryChange}
        onIncreaseStock={handleIncreaseStock}
        onDecreaseStock={handleDecreaseStock}
        onImagesChange={handleImagesChange}
        onThumbnailSelect={handleThumbnailSelect}
        onRemoveImage={handleRemoveImage}
        onSubmit={handleSubmit}
        submitText={isSubmitting ? "상품 등록 중..." : "상품 등록"}
        auctionSection={
          form.type === "AUCTION" ? (
            <section className="rounded-[28px] bg-white/80 p-5 shadow-sm ring-1 ring-amber-200">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-700">경매 설정</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="시작가" htmlFor="startPrice" required error={auctionErrors.startPrice} helpText="1,000원 이상">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">원</span>
                      <Input
                        id="startPrice"
                        type="number"
                        min="1000"
                        step="1"
                        placeholder="1000"
                        value={auctionForm.startPrice}
                        onChange={handleAuctionChange("startPrice")}
                        error={!!auctionErrors.startPrice}
                        className="pl-10 text-right"
                      />
                    </div>
                  </FormField>
                  <FormField label="입찰 단위" htmlFor="bidUnit" required error={auctionErrors.bidUnit} helpText="100원 이상">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">원</span>
                      <Input
                        id="bidUnit"
                        type="number"
                        min="100"
                        step="1"
                        placeholder="100"
                        value={auctionForm.bidUnit}
                        onChange={handleAuctionChange("bidUnit")}
                        error={!!auctionErrors.bidUnit}
                        className="pl-10 text-right"
                      />
                    </div>
                  </FormField>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField label="경매 시작 시간" htmlFor="startedAt" required error={auctionErrors.startedAt}>
                    <Input
                      id="startedAt"
                      type="datetime-local"
                      value={auctionForm.startedAt}
                      onChange={handleAuctionChange("startedAt")}
                      error={!!auctionErrors.startedAt}
                    />
                  </FormField>
                  <FormField label="경매 기간 (분)" htmlFor="durationMinutes" required error={auctionErrors.durationMinutes} helpText="최소 1분">
                    <Input
                      id="durationMinutes"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="60"
                      value={auctionForm.durationMinutes}
                      onChange={handleAuctionChange("durationMinutes")}
                      error={!!auctionErrors.durationMinutes}
                    />
                  </FormField>
                </div>
              </div>
            </section>
          ) : null
        }
        aiDraftAction={
          <AiProductDraftAssistant
            disabled={form.images.length === 0 || isSubmitting}
            loading={isCreatingAiDraft}
            draft={aiDraft}
            error={aiDraftError}
            helperText={
              form.images.length === 0
                ? "이미지를 먼저 등록하면 AI가 상품 정보를 제안할 수 있어요."
                : form.images.length > AI_MAX_IMAGE_FILES
                  ? `AI 분석에는 대표 이미지 기준 최대 ${AI_MAX_IMAGE_FILES}장까지 사용합니다.`
                  : ""
            }
            onGenerate={handleCreateAiDraft}
            onApply={handleApplyAiDraft}
          />
        }
        secondaryAction={
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            취소
          </Button>
        }
      />
    </PageContainer>
  );
}
