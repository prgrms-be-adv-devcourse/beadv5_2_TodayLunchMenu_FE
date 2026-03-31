import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import Button from "../../components/common/Button";
import PageContainer from "../../components/common/PageContainer";
import SellerProductForm from "../../components/seller/SellerProductForm";
import { createProductApi, getCategoriesApi } from "../../features/product/productApi";

const MAX_IMAGE_FILES = 10;
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
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

export default function SellerProductCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    stockQuantity: 1,
    price: "",
    description: "",
    images: [],
    thumbnailIndex: 0,
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryError, setCategoryError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        setCategoryError("");
        const data = await getCategoriesApi();

        if (cancelled) {
          return;
        }

        setCategories(data);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCategoryError(error?.message || "카테고리 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrls(form.images);
    };
  }, [form.images]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
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
      stockQuantity: Math.max(0, Number(prev.stockQuantity || 0) - 1),
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

  const validate = () => {
    const next = {};

    if (!form.title.trim()) {
      next.title = "상품명을 입력해 주세요.";
    }

    if (!form.categoryId) {
      next.categoryId = "카테고리를 선택해 주세요.";
    }

    if (!String(form.price).trim()) {
      next.price = "가격을 입력해 주세요.";
    } else if (Number(form.price) <= 0) {
      next.price = "가격은 0보다 커야 합니다.";
    }

    if (form.stockQuantity === "" || form.stockQuantity === null || form.stockQuantity === undefined) {
      next.stockQuantity = "재고를 입력해 주세요.";
    } else if (Number(form.stockQuantity) < 0) {
      next.stockQuantity = "재고는 0 이상이어야 합니다.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const createdProduct = await createProductApi({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categoryId: form.categoryId,
        images: form.images,
        thumbnailIndex: form.thumbnailIndex,
      });

      navigate(`/products/${createdProduct.id}`);
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

      {submitError ? (
        <section className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {submitError}
        </section>
      ) : null}

      <SellerProductForm
        form={form}
        errors={errors}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoryError={categoryError}
        imageConstraints={IMAGE_CONSTRAINTS}
        onChange={handleChange}
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
