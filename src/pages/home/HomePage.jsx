import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuctionCard from "../../components/auction/AuctionCard";
import ProductCard from "../../components/product/ProductCard";
import HeroBanner from "../../components/home/HeroBanner";
import CategoryTiles from "../../components/home/CategoryTiles";
import { useCart } from "../../features/cart/useCart";
import { useCartToast } from "../../features/cart/useCartToast";
import { getAuctionsApi } from "../../features/auction/auctionApi";
import {
  getCategoriesApi,
  getPopularProductsApi,
  getProductsApi,
  getProductsByIdsApi,
} from "../../features/product/productApi";

function SectionHeader({ title, to }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-base font-black text-gray-900 sm:text-lg">{title}</h2>
      {to && (
        <Link to={to} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          전체 보기 →
        </Link>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="py-10 text-center text-sm text-gray-400">{message}</div>;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart({ autoLoad: false });
  const { toast, showToast } = useCartToast();

  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [popularProducts, setPopularProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [ongoingAuctions, setOngoingAuctions] = useState([]);
  const [auctionImageMap, setAuctionImageMap] = useState({});

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPopularProducts, setLoadingPopularProducts] = useState(true);
  const [loadingLatestProducts, setLoadingLatestProducts] = useState(true);
  const [loadingAuctions, setLoadingAuctions] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCategoriesApi();
        if (!cancelled) setAllCategories(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await getPopularProductsApi({ page: 0, size: 10 });
        if (!cancelled)
          setPopularProducts(response.items.filter((p) => p.type !== "AUCTION"));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingPopularProducts(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await getProductsApi({
          page: 0,
          size: 12,
          sort: "createdAt,desc",
          ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
        });
        if (!cancelled)
          setLatestProducts(response.items.filter((p) => p.type !== "AUCTION"));
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingLatestProducts(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selectedCategoryId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await getAuctionsApi({ status: "ONGOING", page: 0, size: 8 });
        if (cancelled) return;
        setOngoingAuctions(response.items);
        const ids = [...new Set(response.items.map((a) => a.productId).filter(Boolean))];
        if (ids.length) {
          getProductsByIdsApi(ids)
            .then((products) => {
              if (cancelled) return;
              const map = Object.fromEntries(products.map((p) => [p.id, p.image]));
              setAuctionImageMap(map);
            })
            .catch(() => {});
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingAuctions(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleAddToCart(product) {
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      showToast("장바구니에 담았습니다.");
    } catch (error) {
      if (error?.status === 401) {
        navigate("/login");
        return;
      }
      showToast(error?.message || "장바구니에 담지 못했습니다.", true);
    }
  }

  // 루트 카테고리 (parentId 없는 것)
  const rootCategories = useMemo(
    () => allCategories.filter((c) => !c.parentId),
    [allCategories],
  );

  // 카테고리 ID → 루트 카테고리 ID 매핑
  const categoryToRoot = useMemo(() => {
    const map = {};
    function findRoot(cat) {
      if (!cat.parentId) return cat.id;
      const parent = allCategories.find((c) => c.id === cat.parentId);
      return parent ? findRoot(parent) : cat.id;
    }
    allCategories.forEach((c) => { map[c.id] = findRoot(c); });
    return map;
  }, [allCategories]);

  // 실제 상품이 있는 루트 카테고리 ID만 추출
  const activeRootIds = useMemo(() => {
    const ids = new Set();
    [...latestProducts, ...popularProducts].forEach((p) => {
      if (p.categoryId) {
        const rootId = categoryToRoot[p.categoryId];
        if (rootId) ids.add(rootId);
      }
    });
    return ids;
  }, [latestProducts, popularProducts, categoryToRoot]);

  // 상품이 있는 루트 카테고리만
  const activeCategories = useMemo(
    () => rootCategories.filter((c) => activeRootIds.has(c.id)),
    [rootCategories, activeRootIds],
  );

  const mostUrgentAuction =
    ongoingAuctions
      .filter((a) => a.endsAt && a.status === "ONGOING")
      .sort((a, b) => a.endsAt - b.endsAt)[0] ?? null;

  const selectedCategory = activeCategories.find((c) => c.id === selectedCategoryId) ?? null;

  return (
    <div className="text-left">
      <HeroBanner auction={!loadingAuctions ? mostUrgentAuction : null} />

      <div className="mt-8 space-y-10">
        {/* Category Tiles */}
        {!loadingCategories && <CategoryTiles categories={activeCategories} />}

        {/* Live Auctions */}
        <section>
          <SectionHeader title="마감 임박 경매" to="/auctions" />
          {loadingAuctions ? (
            <EmptyState message="경매 목록을 불러오는 중입니다..." />
          ) : ongoingAuctions.length === 0 ? (
            <EmptyState message="현재 진행 중인 경매가 없습니다." />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {ongoingAuctions.map((auction) => (
                <div key={auction.id} className="w-44 flex-none sm:w-52">
                  <AuctionCard auction={auction} productImage={auctionImageMap[auction.productId] ?? null} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Popular Products */}
        <section>
          <SectionHeader title="인기 상품" to="/products" />
          {loadingPopularProducts ? (
            <EmptyState message="인기 상품을 불러오는 중입니다..." />
          ) : popularProducts.length === 0 ? (
            <EmptyState message="인기 상품이 없습니다." />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {popularProducts.map((product) => (
                <div key={product.id} className="w-40 flex-none sm:w-44">
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Latest Products */}
        <section>
          <SectionHeader
            title={selectedCategory ? `${selectedCategory.name} 새 상품` : "새로 등록된 상품"}
            to="/products"
          />

          {/* Category Tab Filter */}
          <div className="mb-4 flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={[
                "whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-semibold transition",
                selectedCategoryId === null
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              전체
            </button>
            {activeCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={[
                  "whitespace-nowrap border-b-2 px-4 pb-3 text-sm font-semibold transition",
                  category.id === selectedCategoryId
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700",
                ].join(" ")}
              >
                {category.name}
              </button>
            ))}
          </div>

          {loadingLatestProducts ? (
            <EmptyState message="상품을 불러오는 중입니다..." />
          ) : latestProducts.length === 0 ? (
            <EmptyState message="해당 카테고리의 상품이 없습니다." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {latestProducts.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg ${toast.error ? "bg-red-500" : "bg-gray-800"}`}>
          {toast.error ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
