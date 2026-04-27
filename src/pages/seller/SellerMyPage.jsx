import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import PageContainer from "../../components/common/PageContainer";
import SellerNav from "../../components/seller/SellerNav";
import { useAuth } from "../../features/auth/useAuth";
import { getCurrentAccountVerificationApi } from "../../features/seller/accountVerificationApi";
import { getPendingSellerIncomesApi, getSellerWalletSummaryApi } from "../../features/payment/sellerPaymentApi";
import { getPartialSettlementAvailableItemsApi } from "../../features/settlement/settlementApi";

function formatKRW(value) {
	return `${new Intl.NumberFormat("ko-KR").format(Number(value) || 0)}원`;
}

function getErrorMessage(error, fallback) {
	return error instanceof ApiError ? error.message : fallback;
}

function getVerificationText(status) {
	switch (status) {
		case "VERIFIED":
			return "인증 완료";
		case "FAILED":
			return "인증 실패";
		case "EXPIRED":
			return "인증 만료";
		case "CANCELLED":
			return "인증 취소";
		case "PENDING":
			return "인증 진행 중";
		default:
			return "미인증";
	}
}

export default function SellerMyPage() {
	const navigate = useNavigate();
	const { user, loading: authLoading } = useAuth();
	const isSeller = user?.role === "SELLER";

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [wallet, setWallet] = useState(null);
	const [pendingIncomes, setPendingIncomes] = useState([]);
	const [partialItems, setPartialItems] = useState([]);
	const [verification, setVerification] = useState(null);

	useEffect(() => {
		if (!isSeller) {
			return;
		}

		let cancelled = false;

		async function loadHubData() {
			setLoading(true);
			setError("");

			const [walletResult, pendingResult, partialResult, verificationResult] =
				await Promise.allSettled([
					getSellerWalletSummaryApi(),
					getPendingSellerIncomesApi({ page: 0, size: 30 }),
					getPartialSettlementAvailableItemsApi(),
					getCurrentAccountVerificationApi(),
				]);

			if (!cancelled) {
				if (walletResult.status === "fulfilled") {
					setWallet(walletResult.value);
				}

				if (pendingResult.status === "fulfilled") {
					setPendingIncomes(pendingResult.value.items ?? []);
				}

				if (partialResult.status === "fulfilled") {
					setPartialItems(partialResult.value ?? []);
				}

				if (verificationResult.status === "fulfilled") {
					setVerification(verificationResult.value);
				}

				const failedReasons = [
					walletResult,
					pendingResult,
					partialResult,
					verificationResult,
				]
					.filter((result) => result.status === "rejected")
					.map((result) => getErrorMessage(result.reason, "일부 데이터를 불러오지 못했습니다."));

				if (failedReasons.length > 0) {
					setError(failedReasons[0]);
				}

				setLoading(false);
			}
		}

		loadHubData();

		return () => {
			cancelled = true;
		};
	}, [isSeller]);

	const pendingIncomeTotal = useMemo(
		() => pendingIncomes.reduce((sum, item) => sum + (item.amount || 0), 0),
		[pendingIncomes]
	);

	if (authLoading) {
		return (
			<PageContainer>
				<p className="py-16 text-center text-sm text-gray-400">권한을 확인하는 중...</p>
			</PageContainer>
		);
	}

	if (!isSeller) {
		return <Navigate to="/seller/register" replace />;
	}

	return (
		<>
			<SellerNav currentPage="home" />
			<PageContainer>
				<section className="mb-6">
					<p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">Seller Dashboard</p>
					<h1 className="mt-1 text-2xl font-black text-gray-900">판매자 대시보드</h1>
					<p className="mt-2 text-sm text-gray-500">
						주문, 상품, 정산, 환불 업무를 한 화면에서 빠르게 확인하고 이동할 수 있습니다.
					</p>
				</section>

				{error && (
					<div className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
						{error}
					</div>
				)}

				<section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
					<article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
						<p className="text-xs font-semibold text-gray-500">사용 가능 잔액</p>
						<p className="mt-2 text-lg font-black text-violet-700">
							{loading ? "-" : formatKRW(wallet?.availableBalance ?? wallet?.balance ?? 0)}
						</p>
					</article>
					<article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
						<p className="text-xs font-semibold text-gray-500">정산 대기 주문 건수</p>
						<p className="mt-2 text-lg font-black text-gray-900">
							{loading ? "-" : `${pendingIncomes.length}건`}
						</p>
					</article>
					<article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
						<p className="text-xs font-semibold text-gray-500">부분 정산 가능</p>
						<p className="mt-2 text-lg font-black text-gray-900">
							{loading ? "-" : `${partialItems.length}건`}
						</p>
					</article>
					<article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
						<p className="text-xs font-semibold text-gray-500">계좌 인증 상태</p>
						<p className="mt-2 text-lg font-black text-gray-900">
							{loading ? "-" : getVerificationText(verification?.status)}
						</p>
					</article>
				</section>

				<section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-violet-100">
					<h2 className="text-sm font-black text-gray-900">정산 스냅샷</h2>
					<div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
						<div className="rounded-xl bg-violet-50 px-4 py-3">
							<p className="text-xs font-semibold text-gray-500">정산 대기 금액 합계</p>
							<p className="mt-1 text-base font-black text-violet-700">{formatKRW(pendingIncomeTotal)}</p>
						</div>
						<div className="rounded-xl bg-blue-50 px-4 py-3">
							<p className="text-xs font-semibold text-gray-500">부분 정산 예상 건수</p>
							<p className="mt-1 text-base font-black text-blue-700">{loading ? "-" : `${partialItems.length}건`}</p>
						</div>
					</div>
				</section>

				<section className="grid grid-cols-1 gap-3 md:grid-cols-2">
					{[
						{
							title: "정산 대기 주문",
							description: "정산 전에 확인할 주문을 빠르게 점검",
							to: "/seller/orders",
						},
						{
							title: "상품 관리",
							description: "판매 상품 조회/수정/등록으로 이동",
							to: "/seller/products",
						},
						{
							title: "정산 관리",
							description: "정산 대기 내역 확인 및 부분 정산 실행",
							to: "/seller/settlements",
						},
						{
							title: "환불 관리",
							description: "환불 대기 목록과 환불 확인 처리",
							to: "/seller/refunds",
						},
						{
							title: "계좌 인증",
							description: "판매 정산용 계좌 인증 상태 확인 및 진행",
							to: "/seller/account-verification",
						},
					].map((item) => (
						<button
							key={item.title}
							type="button"
							onClick={() => navigate(item.to)}
							className="rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-1 ring-violet-100 transition hover:-translate-y-0.5 hover:ring-violet-200"
						>
							<p className="text-base font-black text-gray-900">{item.title}</p>
							<p className="mt-1 text-sm text-gray-500">{item.description}</p>
						</button>
					))}
				</section>
			</PageContainer>
		</>
	);
}
