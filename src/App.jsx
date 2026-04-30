import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Navigate } from "react-router-dom";

import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/common/RequireAdmin";
import Layout from "./components/layout/Layout";
import EmailVerificationPage from "./pages/auth/EmailVerificationPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import KakaoLinkRequiredPage from "./pages/auth/KakaoLinkRequiredPage";
import KakaoOAuthCallbackPage from "./pages/auth/KakaoOAuthCallbackPage";
import LoginPage from "./pages/auth/LoginPage";
import PasswordResetPage from "./pages/auth/PasswordResetPage";
import SignupPage from "./pages/auth/SignupPage";
import SignupPendingVerificationPage from "./pages/auth/SignupPendingVerificationPage";
import CartPage from "./pages/cart/CartPage";
import DepositConfirmPage from "./pages/deposit/DepositConfirmPage";
import DepositFailPage from "./pages/deposit/DepositFailPage";
import DepositPage from "./pages/deposit/DepositPage";
import DepositSuccessPage from "./pages/deposit/DepositSuccessPage";
import AdminCategoryPage from "./pages/admin/AdminCategoryPage";
import AdminEmbeddingPage from "./pages/admin/AdminEmbeddingPage";
import AdminSettlementOpsPage from "./pages/admin/AdminSettlementOpsPage";
import AdminMemberReportDetailPage from "./pages/admin/AdminMemberReportDetailPage";
import AdminMemberReportListPage from "./pages/admin/AdminMemberReportListPage";
import AdminMemberRestrictionListPage from "./pages/admin/AdminMemberRestrictionListPage";
import MemberEditPage from "./pages/member/MemberEditPage";
import MemberPasswordPage from "./pages/member/MemberPasswordPage";
import MemberWithdrawPage from "./pages/member/MemberWithdrawPage";
import ExternalAccountConnectionsPage from "./pages/member/ExternalAccountConnectionsPage";
import MemberSessionsPage from "./pages/member/MemberSessionsPage";
import HomePage from "./pages/home/HomePage";
import MemberProfilePage from "./pages/member/MemberProfilePage";
import MemberReportCreatePage from "./pages/member/MemberReportCreatePage";
import MemberReportHistoryPage from "./pages/member/MemberReportHistoryPage";
import MyPage from "./pages/member/MyPage";
import NotificationListPage from "./pages/notification/NotificationListPage";
import CheckoutPage from "./pages/order/CheckoutPage";
import OrderDetailPage from "./pages/order/OrderDetailPage";
import OrderListPage from "./pages/order/OrderListPage";
import PaymentCardFailPage from "./pages/payment/PaymentCardFailPage";
import PaymentCardSuccessPage from "./pages/payment/PaymentCardSuccessPage";
import PaymentFailPage from "./pages/payment/PaymentFailPage";
import PaymentPage from "./pages/payment/PaymentPage";
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import ProductListPage from "./pages/product/ProductListPage";
import SellerCategoryPage from "./pages/seller/SellerCategoryPage";
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import SellerAccountVerificationPage from "./pages/seller/SellerAccountVerificationPage";
import SellerMyPage from "./pages/seller/SellerMyPage";
import SellerOrderListPage from "./pages/seller/SellerOrderListPage";
import SellerProductCreatePage from "./pages/seller/SellerProductCreatePage";
import SellerProductEditPage from "./pages/seller/SellerProductEditPage";
import SellerProductListPage from "./pages/seller/SellerProductListPage";
import SellerSettlementPage from "./pages/seller/SellerSettlementPage";
import SellerRefundManagementPage from "./pages/seller/SellerRefundManagementPage";
import SellerDeliveryPage from "./pages/seller/SellerDeliveryPage";
import AuctionListPage from "./pages/auction/AuctionListPage";
import AuctionDetailPage from "./pages/auction/AuctionDetailPage";
import WithdrawalPage from "./pages/withdrawal/WithdrawalPage";
import NotFoundPage from "./pages/common/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "products", element: <ProductListPage /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "password-reset", element: <PasswordResetPage /> },
      { path: "signup", element: <SignupPage /> },
      {
        path: "signup/pending-verification",
        element: <SignupPendingVerificationPage />,
      },
      { path: "email-verification", element: <EmailVerificationPage /> },
      { path: "auth/kakao/callback", element: <KakaoOAuthCallbackPage /> },
      { path: "auth/kakao/link-required", element: <KakaoLinkRequiredPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "deposits", element: <DepositPage /> },
      { path: "withdrawals", element: <WithdrawalPage /> },
      { path: "payments/toss/success", element: <DepositConfirmPage /> },
      { path: "deposits/success", element: <DepositSuccessPage /> },
      { path: "payments/toss/fail", element: <DepositFailPage /> },
      { path: "orders/checkout", element: <CheckoutPage /> },
      { path: "payments", element: <PaymentPage /> },
      { path: "payments/card/success", element: <PaymentCardSuccessPage /> },
      { path: "payments/card/fail", element: <PaymentCardFailPage /> },
      { path: "payments/:orderId/success", element: <PaymentSuccessPage /> },
      { path: "payments/:orderId/fail", element: <PaymentFailPage /> },
      { path: "orders", element: <OrderListPage /> },
      { path: "orders/:orderId", element: <OrderDetailPage /> },
      { path: "me", element: <MyPage /> },
      { path: "me/edit", element: <MemberEditPage /> },
      { path: "me/password", element: <MemberPasswordPage /> },
      { path: "me/withdraw", element: <MemberWithdrawPage /> },
      { path: "me/sessions", element: <MemberSessionsPage /> },
      {
        path: "me/external-accounts",
        element: <ExternalAccountConnectionsPage />,
      },
      { path: "members/:memberId", element: <MemberProfilePage /> },
      { path: "member-reports/new", element: <MemberReportCreatePage /> },
      { path: "member-reports/me", element: <MemberReportHistoryPage /> },
      { path: "notifications", element: <NotificationListPage /> },
      { path: "admin/categories", element: <AdminCategoryPage /> },
      { path: "admin/member-reports", element: <AdminMemberReportListPage /> },
      {
        path: "admin/member-reports/:reportId",
        element: <AdminMemberReportDetailPage />,
      },
      {
        path: "admin/member-restrictions",
        element: <AdminMemberRestrictionListPage />,
      },
      { path: "admin/embeddings", element: <AdminEmbeddingPage /> },
      { path: "admin/settlements/ops", element: <AdminSettlementOpsPage /> },
      { path: "seller/categories", element: <SellerCategoryPage /> },
      { path: "seller/register", element: <SellerRegisterPage /> },
      {
        path: "seller/account-verification",
        element: <SellerAccountVerificationPage />,
      },
      { path: "seller", element: <Navigate to="/seller/me" replace /> },
      { path: "seller/me", element: <SellerMyPage /> },
      { path: "seller/orders", element: <SellerOrderListPage /> },
      { path: "seller/products", element: <SellerProductListPage /> },
      { path: "seller/products/new", element: <SellerProductCreatePage /> },
      {
        path: "seller/products/:productId/edit",
        element: <SellerProductEditPage />,
      },
      { path: "seller/settlements", element: <SellerSettlementPage /> },
      { path: "seller/refunds", element: <SellerRefundManagementPage /> },
      { path: "seller/delivery", element: <SellerDeliveryPage /> },
      { path: "auctions", element: <AuctionListPage /> },
      { path: "auctions/:auctionId", element: <AuctionDetailPage /> },
    ],
  },
  {
    path: "/admin",
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "categories", element: <AdminCategoryPage /> },
          { path: "member-reports", element: <AdminMemberReportListPage /> },
          {
            path: "member-reports/:reportId",
            element: <AdminMemberReportDetailPage />,
          },
          {
            path: "member-restrictions",
            element: <AdminMemberRestrictionListPage />,
          },
          { path: "embeddings", element: <AdminEmbeddingPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
