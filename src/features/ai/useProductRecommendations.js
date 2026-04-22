import { useEffect, useState } from "react";

import { getRecommendedProductsApi } from "./aiRecommendationApi";

function useProductRecommendations(productId) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendations() {
      if (!productId) {
        setRecommendations([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getRecommendedProductsApi(productId);

        if (cancelled) {
          return;
        }

        setRecommendations(data);
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setRecommendations([]);
        setError(nextError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return {
    recommendations,
    loading,
    error,
  };
}

export { useProductRecommendations };
