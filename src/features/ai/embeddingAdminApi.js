import { apiClient } from "../../api/client";

/**
 * 누락된 임베딩 추가
 * POST /api/ai/admin/embeddings/backfill-missing
 */
export async function backfillMissingEmbeddingsApi() {
  const response = await apiClient("/api/ai/admin/embeddings/backfill-missing", {
    method: "POST",
  });
  return response.data;
}

/**
 * 전체 임베딩 재색인
 * POST /api/ai/admin/embeddings/reindex-all
 */
export async function reindexAllEmbeddingsApi() {
  const response = await apiClient("/api/ai/admin/embeddings/reindex-all", {
    method: "POST",
  });
  return response.data;
}
