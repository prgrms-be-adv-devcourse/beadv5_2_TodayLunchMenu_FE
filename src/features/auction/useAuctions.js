import { useCallback, useEffect, useRef, useState } from "react";

import {
  getAuctionApi,
  getAuctionBidsApi,
  getAuctionsApi,
  placeBidApi,
} from "./auctionApi";

function useAuctions({ status, page = 0, size = 9 } = {}) {
  const [auctions, setAuctions] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
  });
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAuctions() {
      try {
        setFetching(true);
        setError(null);

        const params = { page, size };
        if (status) {
          params.status = status;
        }

        const data = await getAuctionsApi(params);

        if (cancelled) {
          return;
        }

        setAuctions(data.items);
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

    loadAuctions();

    return () => {
      cancelled = true;
    };
  }, [status, page, size]);

  return { auctions, pageInfo, loading, fetching, error };
}

function useAuction(auctionId) {
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);

  const loadAuction = useCallback(async () => {
    if (!auctionId) {
      setAuction(null);
      setLoading(false);
      return;
    }

    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      setError(null);

      const data = await getAuctionApi(auctionId);
      setAuction(data);
      hasLoadedRef.current = true;
    } catch (nextError) {
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (cancelled) {
        return;
      }

      await loadAuction();
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [loadAuction]);

  return { auction, setAuction, loading, error, reload: loadAuction };
}

function useAuctionBids(auctionId, { size = 20 } = {}) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!auctionId) {
      setBids([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getAuctionBidsApi(auctionId, { page: 0, size });
      setBids(data.items);
    } catch (nextError) {
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, [auctionId, size]);

  useEffect(() => {
    reload();
  }, [reload]);

  const prependBid = useCallback((bid) => {
    setBids((prev) => {
      // 같은 id 또는 같은 금액(경매 특성상 금액은 단조증가)이면 중복
      if (prev.some((b) => b.id === bid.id || b.amount === bid.amount)) {
        return prev;
      }

      const updated = prev.map((b, i) =>
        i === 0 && (b.status === "ACTIVE" || b.status === "WINNING")
          ? { ...b, status: "OUTBID" }
          : b
      );
      return [bid, ...updated].slice(0, size);
    });
  }, [size]);

  return { bids, setBids, prependBid, loading, error, reload };
}

async function placeBid(auctionId, bidPrice) {
  return placeBidApi(auctionId, { bidPrice });
}

export { placeBid, useAuction, useAuctionBids, useAuctions };
