import { useEffect, useState } from "react";
import {
  getCategoriesApi,
  getProductDetailApi,
  getProductsApi,
} from "./productApi";

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
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setFetching(true);
        setError(null);

        const data = await getProductsApi(params);

        if (cancelled) {
          return;
        }

        setProducts(data.items);
        setPageInfo(data.pageInfo);
        setLoading(false);
      } catch (nextError) {
        if (cancelled) {
          return;
        }

        setError(nextError);
        setLoading(false);
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [params.page, params.size, params.sort, params.keyword, params.categoryId]);

  return {
    products,
    pageInfo,
    loading,
    fetching,
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

function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getCategoriesApi();
        if (!cancelled) setCategories(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}

export { useProduct, useProducts, useCategories };
