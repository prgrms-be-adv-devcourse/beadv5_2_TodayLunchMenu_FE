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
  sellerId: category.sellerId ?? null,
  createdAt: category.createdAt ?? null,
});

async function getProductsApi(params = {}) {
  const response = await apiClient("/api/products", {
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

  images.forEach((image) => {
    formData.append("images", image.file ?? image);
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

export {
  createProductApi,
  updateProductApi,
  uploadProductImageApi,
  deleteProductImageApi,
  getCategoriesApi,
  getChildCategoriesApi,
  getProductDetailApi,
  getProductsByIdsApi,
  getProductsApi,
  getSellerProductsApi,
  createCategoryAdminApi,
  createCategorySellerApi,
  updateCategoryAdminApi,
  updateCategorySellerApi,
  deleteCategoryApi,
};

