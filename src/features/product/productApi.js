import { apiClient } from "../../api/client";

const S3_BASE_URL = import.meta.env.VITE_S3_BASE_URL || "https://todaylunchmenu.s3.ap-northeast-2.amazonaws.com";

const MAX_PRODUCT_IMAGE_FILE_SIZE = 5 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_COUNT = 5;
const MAX_PRODUCT_IMAGE_TOTAL_SIZE = 30 * 1024 * 1024;

const ensureValidImageSize = (file) => {
  if (!file) {
    return;
  }

  if (file.size > MAX_PRODUCT_IMAGE_FILE_SIZE) {
    throw new Error("이미지 파일은 각각 5MB 이하여야 합니다.");
  }
};

const ensureValidProductImagePayload = (files) => {
  if (files.length > MAX_PRODUCT_IMAGE_COUNT) {
    throw new Error(`상품 이미지는 최대 ${MAX_PRODUCT_IMAGE_COUNT}장까지 등록할 수 있습니다.`);
  }

  const totalImageSize = files.reduce((sum, file) => sum + (file?.size ?? 0), 0);
  if (totalImageSize > MAX_PRODUCT_IMAGE_TOTAL_SIZE) {
    throw new Error("이미지 요청 전체 크기는 최대 30MB까지 허용됩니다.");
  }
};

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
  url: image.s3Key ? `${S3_BASE_URL}/${image.s3Key}` : null,
  sortOrder: image.sortOrder ?? 0,
  isThumbnail: Boolean(image.isThumbnail),
  createdAt: image.createdAt,
});

const toUiProduct = (product) => {
  const images = Array.isArray(product.images)
    ? product.images.map(toUiImage)
    : [];
  const thumbnail = images.find((image) => image.isThumbnail) || images[0] || null;

  // 목록 API는 images 배열 없이 thumbnailKey만 반환하므로 fallback 처리
  let imageUrl = thumbnail?.url ?? null;
  if (!imageUrl && product.thumbnailKey) {
    imageUrl = `${S3_BASE_URL}/${product.thumbnailKey}`;
  }

  return {
    id: product.productId,
    sellerId: product.sellerId ?? null,
    name: product.title,
    description: product.description || "상품 설명이 아직 등록되지 않았습니다.",
    price: toNumber(product.price),
    stockCount: product.count ?? 0,
    status: product.status,
    type: product.type ?? "GENERAL",
    createdAt: product.createdAt,
    categoryId: product.categoryId ?? null,
    category: product.categoryName || "미분류",
    image: imageUrl,
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
  sellerId: category.sellerId ?? null,
  createdAt: category.createdAt ?? null,
});

async function getProductsApi(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  );
  const response = await apiClient("/api/products", {
    params: cleanParams,
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

async function getPopularProductsApi(params = {}) {
  const { sort: _sort, ...safeParams } = params;
  const response = await apiClient("/api/products/popular", {
    params: safeParams,
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
  const response = await apiClient(`/api/products/${productId}`);
  return toUiProduct(response.data);
}

async function getSellerProductsApi(params = {}) {
  const response = await apiClient("/api/products/seller", {
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

async function updateProductApi(productId, { title, description, price, stockQuantity, categoryId }) {
  const response = await apiClient(`/api/products/${productId}`, {
    method: "PUT",
    body: { title, description: description || null, price, stockQuantity, categoryId },
  });
  return toUiProduct(response.data);
}

async function createProductApi({
  title,
  description,
  price,
  stockQuantity,
  categoryId,
  type = "GENERAL",
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
      type,
    })
  );

  const imageFiles = images.map((image) => image.file ?? image);
  imageFiles.forEach(ensureValidImageSize);
  ensureValidProductImagePayload(imageFiles);

  imageFiles.forEach((file) => {
    formData.append("images", file);
  });

  if (images.length > 0) {
    formData.append("thumbnailIndex", String(thumbnailIndex));
  }

  const response = await apiClient("/api/products", {
    method: "POST",
    body: formData,
  });

  return toUiProduct(response.data);
}

async function uploadProductImageApi(productId, file, { sortOrder = 0, isThumbnail = false } = {}) {
  ensureValidImageSize(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("sortOrder", String(sortOrder));
  formData.append("isThumbnail", String(isThumbnail));

  const response = await apiClient(`/api/products/${productId}/images`, {
    method: "POST",
    body: formData,
  });
  return toUiImage(response.data);
}

async function deleteProductImageApi(productId, imageId) {
  await apiClient(`/api/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

async function setImageThumbnailApi(productId, imageId) {
  const response = await apiClient(`/api/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    body: { isThumbnail: true },
  });
  return toUiImage(response.data);
}

async function createCategoryAdminApi({ name, description, sortOrder, parentId }) {
  const response = await apiClient("/api/categories/admin", {
    method: "POST",
    body: { name, description: description || null, sortOrder: Number(sortOrder) || 0, parentId: parentId || null },
  });
  return toUiCategory(response.data);
}

async function createCategorySellerApi({ name, description, sortOrder, parentId }) {
  const response = await apiClient("/api/categories", {
    method: "POST",
    body: { name, description: description || null, sortOrder: Number(sortOrder) || 0, parentId },
  });
  return toUiCategory(response.data);
}

async function updateCategoryAdminApi(categoryId, { name, description, sortOrder }) {
  const response = await apiClient(`/api/categories/admin/${categoryId}`, {
    method: "PUT",
    body: { name, description: description || null, sortOrder: Number(sortOrder) || 0 },
  });
  return toUiCategory(response.data);
}

async function updateCategorySellerApi(categoryId, { name, description, sortOrder }) {
  const response = await apiClient(`/api/categories/${categoryId}`, {
    method: "PUT",
    body: { name, description: description || null, sortOrder: Number(sortOrder) || 0 },
  });
  return toUiCategory(response.data);
}

async function deleteCategoryApi(categoryId) {
  await apiClient(`/api/categories/${categoryId}`, {
    method: "DELETE",
  });
}

async function getProductsByIdsApi(productIds) {
  if (!productIds || productIds.length === 0) return [];
  const query = productIds.map((id) => `productIds=${encodeURIComponent(id)}`).join("&");
  const response = await apiClient(`/api/products/by-ids?${query}`);
  const list = Array.isArray(response.data) ? response.data : [];
  return list.map(toUiProduct);
}

async function reindexProductsEsApi() {
  const response = await apiClient("/api/admin/products/reindex", {
    method: "POST",
  });
  return response.data;
}

export {
  createProductApi,
  updateProductApi,
  uploadProductImageApi,
  deleteProductImageApi,
  setImageThumbnailApi,
  getCategoriesApi,
  getChildCategoriesApi,
  getProductDetailApi,
  getProductsByIdsApi,
  getProductsApi,
  getPopularProductsApi,
  getSellerProductsApi,
  createCategoryAdminApi,
  createCategorySellerApi,
  updateCategoryAdminApi,
  updateCategorySellerApi,
  deleteCategoryApi,
  reindexProductsEsApi,
};

