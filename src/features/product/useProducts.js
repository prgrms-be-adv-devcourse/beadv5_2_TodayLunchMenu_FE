import { useEffect, useState } from "react";
import { getProductDetailApi, getProductsApi } from "./productApi";

function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProductsApi(params);

        if (cancelled) {
          return;
        }

        setProducts(data.items);
        setPageInfo(data.pageInfo);
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setError(nextError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [params.page, params.size, params.sort]);

  return {
    products,
    pageInfo,
    loading,
    error,
  };
}

function useProduct(productId) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      if (!productId) {
        setProduct(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await getProductDetailApi(productId);

        if (cancelled) {
          return;
        }

        setProduct(data);
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setError(nextError);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return {
    product,
    loading,
    error,
  };
}

export { useProduct, useProducts };
