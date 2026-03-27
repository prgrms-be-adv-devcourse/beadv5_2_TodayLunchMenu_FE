import { useEffect, useState } from "react";
import { getMySellerInfoApi, registerSellerApi } from "./sellerApi";

function useSeller(enabled = true) {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setSeller(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchSeller = async () => {
      setLoading(true);
      setError(null);

      try {
        const sellerData = await getMySellerInfoApi();

        if (!cancelled) {
          setSeller(sellerData);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSeller();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const refreshSeller = async () => {
    if (!enabled) {
      setSeller(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const sellerData = await getMySellerInfoApi();
      setSeller(sellerData);
      return sellerData;
    } catch (refreshError) {
      setError(refreshError);
      throw refreshError;
    } finally {
      setLoading(false);
    }
  };

  const registerSeller = async ({ bankName, account }) => {
    const registeredSeller = await registerSellerApi({ bankName, account });
    await refreshSeller();
    return registeredSeller;
  };

  return {
    seller,
    isSeller: Boolean(seller),
    loading,
    error,
    refreshSeller,
    registerSeller,
  };
}

export { useSeller };
