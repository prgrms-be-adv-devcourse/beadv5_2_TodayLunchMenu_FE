import { apiClient } from "../../api/client";

const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const toUiAuction = (auction) => {
  const startPrice = toNumber(auction.startPrice, 0);
  const currentPrice = toNumber(auction.currentHighestPrice, startPrice);

  return {
    id: auction.auctionId,
    productId: auction.productId,
    productTitle: auction.productTitle || null,
    thumbnailKey: auction.thumbnailKey || null,
    sellerId: auction.sellerId,
    startPrice,
    bidUnit: toNumber(auction.bidUnit, 0),
    currentPrice,
    hasBid: auction.currentHighestPrice !== null && auction.currentHighestPrice !== undefined,
    status: auction.status,
    startedAt: toTimestamp(auction.startedAt),
    scheduledCloseAt: toTimestamp(auction.scheduledCloseAt),
    endsAt: toTimestamp(auction.endedAt) || toTimestamp(auction.scheduledCloseAt),
    createdAt: toTimestamp(auction.createdAt),
  };
};

const toUiBid = (bid) => ({
  id: bid.bidId,
  auctionId: bid.auctionId,
  bidderId: bid.bidderId,
  bidderName: bid.bidderName || bid.nickname || null,
  amount: toNumber(bid.bidPrice, 0),
  status: bid.status,
  createdAt: toTimestamp(bid.createdAt),
});

const unwrap = (body) => {
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data;
  }
  return body;
};

const toUiPage = (page, itemMapper) => ({
  items: Array.isArray(page?.items) ? page.items.map(itemMapper) : [],
  pageInfo: {
    page: page?.page ?? 0,
    size: page?.size ?? 0,
    totalElements: page?.totalElements ?? 0,
    totalPages: page?.totalPages ?? 0,
    hasNext: page?.hasNext ?? false,
  },
});

async function getAuctionsApi(params = {}) {
  const response = await apiClient("/api/auctions", { params });
  return toUiPage(unwrap(response.data), toUiAuction);
}

async function getAuctionApi(auctionId) {
  const response = await apiClient(`/api/auctions/${auctionId}`);
  return toUiAuction(unwrap(response.data));
}

async function getAuctionBidsApi(auctionId, params = {}) {
  const response = await apiClient(`/api/auctions/${auctionId}/bids`, { params });
  return toUiPage(unwrap(response.data), toUiBid);
}

async function placeBidApi(auctionId, { bidPrice }) {
  const response = await apiClient(`/api/auctions/${auctionId}/bids`, {
    method: "POST",
    body: { bidPrice },
  });

  return toUiBid(unwrap(response.data));
}

async function createAuctionApi({ productId, productTitle, thumbnailKey, startPrice, bidUnit, startedAt, durationMinutes }) {
  const response = await apiClient("/api/auctions", {
    method: "POST",
    body: { productId, productTitle, thumbnailKey, startPrice, bidUnit, startedAt, durationMinutes },
  });
  return toUiAuction(unwrap(response.data));
}

export {
  createAuctionApi,
  getAuctionApi,
  getAuctionBidsApi,
  getAuctionsApi,
  placeBidApi,
};
