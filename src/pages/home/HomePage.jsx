import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuctionCard from "../../components/auction/AuctionCard";
import ProductCard from "../../components/product/ProductCard";
import HeroBanner from "../../components/home/HeroBanner";
import CategoryTiles from "../../components/home/CategoryTiles";
import { useCart } from "../../features/cart/useCart";
import { getAuctionsApi } from "../../features/auction/auctionApi";
import {
  getCategoriesApi,
  getPopularProductsApi,
  getProductsApi,
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

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [popularProducts, setPopularProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [ongoingAuctions, setOngoingAuctions] = useState([]);

  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingPopularProducts, setLoadingPopularProducts] = useState(true);
  const [loadingLatestProducts, setLoadingLatestProducts] = useState(true);
  const [loadingAuctions, setLoadingAuctions] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCategoriesApi({ depth: 1 });
        if (!cancelled) setCategories(data);
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
        if (!cancelled) setOngoingAuctions(response.items);
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
      window.alert("장바구니에 담았습니다.");
    } catch (error) {
      if (error?.status === 401) {
        navigate("/login");
        return;
      }
      window.alert(error?.message || "장바구니에 담지 못했습니다.");
    }
  }

  const mostUrgentAuction =
    ongoingAuctions
      .filter((a) => a.endsAt && a.status === "ONGOING")
      .sort((a, b) => a.endsAt - b.endsAt)[0] ?? null;

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;

  return (
    <div className="text-left">
      <HeroBanner auction={!loadingAuctions ? mostUrgentAuction : null} />

      <div className="mt-8 space-y-10">
        {/* Category Tiles */}
        {!loadingCategories && <CategoryTiles categories={categories} />}

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
                  <AuctionCard auction={auction} />
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
            {categories.map((category) => (
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
    </div>
  );
}
