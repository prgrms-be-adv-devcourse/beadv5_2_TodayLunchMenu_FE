import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageContainer from "../../components/common/PageContainer";
import AuctionCard from "../../components/auction/AuctionCard";
import ProductCard from "../../components/product/ProductCard";
import { useCart } from "../../features/cart/useCart";
import { getAuctionsApi } from "../../features/auction/auctionApi";
import {
  getCategoriesApi,
  getPopularProductsApi,
  getProductsApi,
} from "../../features/product/productApi";

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-500">
          {eyebrow}
        </p>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function SectionStatus({ message, tone = "default" }) {
  const toneClassName =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-orange-100 bg-white/80 text-gray-600";

  return (
    <div className={`rounded-[28px] border px-5 py-8 text-sm ${toneClassName}`}>
      {message}
    </div>
  );
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

  const [categoriesError, setCategoriesError] = useState(null);
  const [popularProductsError, setPopularProductsError] = useState(null);
  const [latestProductsError, setLatestProductsError] = useState(null);
  const [auctionsError, setAuctionsError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        setLoadingCategories(true);
        setCategoriesError(null);

        const nextCategories = await getCategoriesApi({ depth: 1 });

        if (cancelled) {
          return;
        }

        setCategories(nextCategories);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCategoriesError(error);
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPopularProducts() {
      try {
        setLoadingPopularProducts(true);
        setPopularProductsError(null);

        const response = await getPopularProductsApi({
          page: 0,
          size: 8,
        });

        if (cancelled) {
          return;
        }

        setPopularProducts(response.items.filter((product) => product.type !== "AUCTION"));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPopularProductsError(error);
      } finally {
        if (!cancelled) {
          setLoadingPopularProducts(false);
        }
      }
    }

    loadPopularProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestProducts() {
      try {
        setLoadingLatestProducts(true);
        setLatestProductsError(null);

        const response = await getProductsApi({
          page: 0,
          size: 12,
          sort: "createdAt,desc",
          ...(selectedCategoryId ? { categoryId: selectedCategoryId } : {}),
        });

        if (cancelled) {
          return;
        }

        setLatestProducts(response.items.filter((product) => product.type !== "AUCTION"));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLatestProductsError(error);
      } finally {
        if (!cancelled) {
          setLoadingLatestProducts(false);
        }
      }
    }

    loadLatestProducts();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  useEffect(() => {
    let cancelled = false;

    async function loadOngoingAuctions() {
      try {
        setLoadingAuctions(true);
        setAuctionsError(null);

        const response = await getAuctionsApi({
          status: "ONGOING",
          page: 0,
          size: 3,
        });

        if (cancelled) {
          return;
        }

        setOngoingAuctions(response.items);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAuctionsError(error);
      } finally {
        if (!cancelled) {
          setLoadingAuctions(false);
        }
      }
    }

    loadOngoingAuctions();

    return () => {
      cancelled = true;
    };
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

  const selectedCategory =
    categories.find((category) => category.id === selectedCategoryId) ?? null;

  return (
    <PageContainer>
      <section>
        {loadingCategories ? (
          <SectionStatus message="카테고리를 불러오는 중입니다." />
        ) : categoriesError ? (
          <SectionStatus
            tone="error"
            message={categoriesError.message || "카테고리를 불러오지 못했습니다."}
          />
        ) : (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                selectedCategoryId === null
                  ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "border-orange-100 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50",
              ].join(" ")}
            >
              전체 보기
            </button>

            {categories.map((category) => {
              const active = category.id === selectedCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    active
                      ? "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "border-orange-100 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50",
                  ].join(" ")}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionHeader
          eyebrow="Best Picks"
          title="지금 인기 있는 상품"
          description="조회가 많이 발생한 ACTIVE 상품을 기준으로 먼저 보여줍니다."
          action={
            <Link
              to="/products"
              className="text-sm font-bold text-orange-700 transition hover:text-orange-800"
            >
              상품 전체 보기
            </Link>
          }
        />

        {loadingPopularProducts ? (
          <SectionStatus message="인기 상품을 불러오는 중입니다." />
        ) : popularProductsError ? (
          <SectionStatus
            tone="error"
            message={popularProductsError.message || "인기 상품을 불러오지 못했습니다."}
          />
        ) : popularProducts.length === 0 ? (
          <SectionStatus message="표시할 인기 상품이 아직 없습니다." />
        ) : (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {popularProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </section>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader
          eyebrow="New Arrival"
          title={
            selectedCategory
              ? `${selectedCategory.name} 카테고리의 새 상품`
              : "최근 등록된 새 상품"
          }
          description="카테고리를 고르면 해당 분류 기준으로 최신 상품을 다시 조회합니다."
          action={
            <Link
              to="/products"
              className="text-sm font-bold text-orange-700 transition hover:text-orange-800"
            >
              목록으로 이동
            </Link>
          }
        />

        {loadingLatestProducts ? (
          <SectionStatus message="최신 상품을 불러오는 중입니다." />
        ) : latestProductsError ? (
          <SectionStatus
            tone="error"
            message={latestProductsError.message || "최신 상품을 불러오지 못했습니다."}
          />
        ) : latestProducts.length === 0 ? (
          <SectionStatus message="선택한 조건에 맞는 상품이 없습니다." />
        ) : (
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {latestProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </section>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader
          eyebrow="Live Auction"
          title="지금 바로 참여할 수 있는 경매"
          description="진행 중인 경매만 따로 모아서 보여줍니다."
          action={
            <Link
              to="/auctions"
              className="text-sm font-bold text-orange-700 transition hover:text-orange-800"
            >
              경매장 전체 보기
            </Link>
          }
        />

        {loadingAuctions ? (
          <SectionStatus message="진행 중 경매를 불러오는 중입니다." />
        ) : auctionsError ? (
          <SectionStatus
            tone="error"
            message={auctionsError.message || "진행 중 경매를 불러오지 못했습니다."}
          />
        ) : ongoingAuctions.length === 0 ? (
          <SectionStatus message="현재 진행 중인 경매가 없습니다." />
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {ongoingAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
