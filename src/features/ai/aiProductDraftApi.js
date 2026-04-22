import { apiClient } from "../../api/client";

function getApiPayload(data) {
  return data?.data ?? data;
}

function toPriceText(value) {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    return "";
  }

  return String(Math.round(price));
}

function toUiProductDraft(draft) {
  return {
    suggestedTitle: draft?.suggestedTitle ?? "",
    suggestedDescription: draft?.suggestedDescription ?? "",
    suggestedPrice: toPriceText(draft?.suggestedPrice),
    suggestedKeywords: Array.isArray(draft?.suggestedKeywords)
      ? draft.suggestedKeywords
      : [],
    notes: draft?.notes ?? "",
  };
}

async function createProductDraftFromImageApi({
  images,
  inputFields,
  titleDraft,
  descriptionDraft,
  priceDraft,
  categoryName,
  categoryPathText,
  thumbnailIndex,
}) {
  const formData = new FormData();

  images.forEach((image) => {
    formData.append("images", image.file ?? image);
  });

  formData.append(
    "request",
    JSON.stringify({
      inputFields,
      titleDraft,
      descriptionDraft,
      priceDraft,
      categoryName,
      categoryPathText,
      thumbnailIndex,
    })
  );

  const response = await apiClient("/api/ai/assist/product-draft-from-image", {
    method: "POST",
    body: formData,
    timeout: 30000,
  });

  return toUiProductDraft(getApiPayload(response.data));
}

export { createProductDraftFromImageApi };
