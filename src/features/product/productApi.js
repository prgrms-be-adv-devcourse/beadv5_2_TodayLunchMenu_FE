import { apiClient } from "../../api/client";

const toNumber = (value) => {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toUiImage = (image) => ({
  id: image.imageId,
  s3Key: image.s3Key,
  url: image.presignedUrl || null,
  sortOrder: image.sortOrder ?? 0,
  isThumbnail: Boolean(image.isThumbnail),
  createdAt: image.createdAt,
});

const toUiProduct = (product) => {
  const images = Array.isArray(product.images)
    ? product.images.map(toUiImage)
    : [];
  const thumbnail = images.find((image) => image.isThumbnail) || images[0] || null;

  return {
    id: product.productId,
    name: product.title,
    description: product.description || "상품 설명이 아직 등록되지 않았습니다.",
    price: toNumber(product.price),
    stockCount: product.count ?? 0,
    status: product.status,
    createdAt: product.createdAt,
    categoryId: product.categoryId ?? null,
    category: product.categoryName || "미분류",
    image: thumbnail?.url ?? null,
    badge: null,
    images,
  };
};

const toUiCategory = (category) => ({
  id: category.categoryId,
  name: category.name,
  description: category.description || "",
  depth: category.depth ?? 0,
  sortOrder: category.sortOrder ?? 0,
  parentId: category.parentId ?? null,
});

async function getProductsApi(params = {}) {
  const response = await apiClient("/api/product", {
    params,
  });

  const page = response.data ?? {};

  return {
    items: Array.isArray(page.content) ? page.content.map(toUiProduct) : [],
    pageInfo: {
      page: page.number ?? 0,
      size: page.size ?? 0,
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      first: page.first ?? true,
      last: page.last ?? true,
    },
  };
}

async function getProductDetailApi(productId) {
  const response = await apiClient(`/api/product/${productId}`);
  return toUiProduct(response.data);
}

async function getCategoriesApi(options = {}) {
  const { depth } = options;
  const response = await apiClient("/api/categories", {
    params: depth === undefined ? undefined : { depth },
  });
  const categories = Array.isArray(response.data) ? response.data : [];

  return categories
    .map(toUiCategory)
    .sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }

      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ko");
    });
}

async function getChildCategoriesApi(categoryId) {
  const response = await apiClient(`/api/categories/${categoryId}/children`);
  const categories = Array.isArray(response.data) ? response.data : [];

  return categories
    .map(toUiCategory)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return a.name.localeCompare(b.name, "ko");
    });
}

async function createProductApi({
  title,
  description,
  price,
  stockQuantity,
  categoryId,
  images = [],
  thumbnailIndex = 0,
}) {
  const formData = new FormData();

  formData.append(
    "productData",
    JSON.stringify({
      title,
      description: description || null,
      price,
      stockQuantity,
      categoryId,
    })
  );

  images.forEach((image) => {
    formData.append("images", image.file ?? image);
  });

  if (images.length > 0) {
    formData.append("thumbnailIndex", String(thumbnailIndex));
  }

  const response = await apiClient("/api/product", {
    method: "POST",
    body: formData,
  });

  return toUiProduct(response.data);
}

export {
  createProductApi,
  getCategoriesApi,
  getChildCategoriesApi,
  getProductDetailApi,
  getProductsApi,
};

