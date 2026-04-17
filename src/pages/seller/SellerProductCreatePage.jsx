import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import SellerProductForm from "../../components/seller/SellerProductForm";
import {
  createProductApi,
  getCategoriesApi,
  getChildCategoriesApi,
} from "../../features/product/productApi";

const MAX_IMAGE_FILES = 10;
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IMAGE_CONSTRAINTS = {
  maxFiles: MAX_IMAGE_FILES,
  maxFileSizeLabel: "10MB",
  acceptedTypesLabel: "JPG, PNG, WEBP, GIF",
  accept: "image/jpeg,image/png,image/webp,image/gif",
};

const MIN_PRICE = 1000;
const MIN_STOCK = 1;

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
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          setCategoryNotice("등록된 대분류 카테고리가 없습니다. 관리자에게 문의해 주세요.");
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCategories((prev) => ({ ...prev, depth0: [] }));
        setCategoryNotice("카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
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

  const handleImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    const invalidTypeFile = files.find((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type));
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
          nextImages.length === 0 ? 0 : Math.min(prev.thumbnailIndex, nextImages.length - 1),
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

      const nextImages = prev.images.filter((_, currentIndex) => currentIndex !== index);
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

  const loadChildCategories = async (parentId) => {
    try {
      return await getChildCategoriesApi(parentId);
    } catch (error) {
      setCategoryError("하위 카테고리를 불러오지 못했습니다.");
      return [];
    }
  };

  const handleCategoryChange = async (depthKey, nextCategoryId) => {
    setSubmitError("");
    setErrors((prev) => ({ ...prev, categoryId: "" }));
    setCategoryError("");

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

      setCategoriesLoading((prev) => ({ ...prev, depth1: true, depth2: false }));
      const children = await loadChildCategories(nextCategoryId);
      setCategories((prev) => ({ ...prev, depth1: children, depth2: [] }));
      setCategoriesLoading((prev) => ({ ...prev, depth1: false, depth2: false }));
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
      const children = await loadChildCategories(nextCategoryId);
      setCategories((prev) => ({ ...prev, depth2: children }));
      setCategoriesLoading((prev) => ({ ...prev, depth2: false }));
      return;
    }

    if (depthKey === "depth2Id") {
      setCategorySelection((prev) => ({ ...prev, depth2Id: nextCategoryId }));
      setForm((prev) => ({
        ...prev,
        categoryId: nextCategoryId || categorySelection.depth1Id || categorySelection.depth0Id,
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
    if (form.stockQuantity === "" || form.stockQuantity === null || form.stockQuantity === undefined) {
      next.stockQuantity = "재고를 입력해 주세요.";
    } else if (!Number.isInteger(stockNumber)) {
      next.stockQuantity = "재고는 정수로 입력해 주세요.";
    } else if (stockNumber < MIN_STOCK) {
      next.stockQuantity = `재고는 ${MIN_STOCK} 이상이어야 합니다.`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      await createProductApi({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categoryId: form.categoryId,
        type: form.type,
        images: form.images,
        thumbnailIndex: form.thumbnailIndex,
      });

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

