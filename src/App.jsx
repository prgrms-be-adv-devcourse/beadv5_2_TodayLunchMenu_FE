import { RouterProvider, createBrowserRouter } from "react-router-dom";

import Layout from "./components/layout/Layout";
import EmailVerificationPage from "./pages/auth/EmailVerificationPage";
import KakaoLinkRequiredPage from "./pages/auth/KakaoLinkRequiredPage";
import KakaoOAuthCallbackPage from "./pages/auth/KakaoOAuthCallbackPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import SignupPendingVerificationPage from "./pages/auth/SignupPendingVerificationPage";
import CartPage from "./pages/cart/CartPage";
import DepositConfirmPage from "./pages/deposit/DepositConfirmPage";
import DepositFailPage from "./pages/deposit/DepositFailPage";
import DepositPage from "./pages/deposit/DepositPage";
import DepositSuccessPage from "./pages/deposit/DepositSuccessPage";
import AdminMemberReportDetailPage from "./pages/admin/AdminMemberReportDetailPage";
import AdminMemberReportListPage from "./pages/admin/AdminMemberReportListPage";
import AdminMemberRestrictionListPage from "./pages/admin/AdminMemberRestrictionListPage";
import MemberEditPage from "./pages/member/MemberEditPage";
import ExternalAccountConnectionsPage from "./pages/member/ExternalAccountConnectionsPage";
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
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import SellerProductCreatePage from "./pages/seller/SellerProductCreatePage";
import SellerProductListPage from "./pages/seller/SellerProductListPage";
import Layout from "./components/layout/Layout";
import ProductListPage from "./pages/product/ProductListPage";
import ProductDetailPage from "./pages/product/ProductDetailPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import CartPage from "./pages/cart/CartPage";
import DepositPage from "./pages/deposit/DepositPage";
import DepositConfirmPage from "./pages/deposit/DepositConfirmPage";
import DepositSuccessPage from "./pages/deposit/DepositSuccessPage";
import DepositFailPage from "./pages/deposit/DepositFailPage";
import CheckoutPage from "./pages/order/CheckoutPage";
import OrderListPage from "./pages/order/OrderListPage";
import OrderDetailPage from "./pages/order/OrderDetailPage";
import PaymentPage from "./pages/payment/PaymentPage";
import PaymentSuccessPage from "./pages/payment/PaymentSuccessPage";
import PaymentFailPage from "./pages/payment/PaymentFailPage";
import MyPage from "./pages/member/MyPage";
import MemberProfilePage from "./pages/member/MemberProfilePage";
import MemberEditPage from "./pages/member/MemberEditPage";
import MemberReportCreatePage from "./pages/member/MemberReportCreatePage";
import MemberReportHistoryPage from "./pages/member/MemberReportHistoryPage";
import AdminMemberReportListPage from "./pages/admin/AdminMemberReportListPage";
import AdminMemberReportDetailPage from "./pages/admin/AdminMemberReportDetailPage";
import AdminMemberRestrictionListPage from "./pages/admin/AdminMemberRestrictionListPage";
import NotificationListPage from "./pages/notification/NotificationListPage";
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import SellerProductCreatePage from "./pages/seller/SellerProductCreatePage";
import SellerProductListPage from "./pages/seller/SellerProductListPage";
import AuctionListPage from "./pages/auction/AuctionListPage";
import AuctionDetailPage from "./pages/auction/AuctionDetailPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "products", element: <ProductListPage /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "login", element: <LoginPage /> },
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
      {
        path: "me/external-accounts",
        element: <ExternalAccountConnectionsPage />,
      },
      { path: "members/:memberId", element: <MemberProfilePage /> },
      { path: "member-reports/new", element: <MemberReportCreatePage /> },
      { path: "member-reports/me", element: <MemberReportHistoryPage /> },
      { path: "notifications", element: <NotificationListPage /> },
      { path: "admin/member-reports", element: <AdminMemberReportListPage /> },
      {
        path: "admin/member-reports/:reportId",
        element: <AdminMemberReportDetailPage />,
      },
      {
        path: "admin/member-restrictions",
        element: <AdminMemberRestrictionListPage />,
      },
      { path: "seller/register", element: <SellerRegisterPage /> },
      { path: "seller/products", element: <SellerProductListPage /> },
      { path: "seller/products/new", element: <SellerProductCreatePage /> },
      { path: "products", element: <ProductListPage /> },
      { path: "products/:productId", element: <ProductDetailPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "deposits", element: <DepositPage /> },
      { path: "payments/toss/success", element: <DepositConfirmPage /> },
      { path: "deposits/success", element: <DepositSuccessPage /> },
      { path: "payments/toss/fail", element: <DepositFailPage /> },
      { path: "orders/checkout", element: <CheckoutPage /> },
      { path: "payments", element: <PaymentPage /> },
      { path: "payments/:orderId/success", element: <PaymentSuccessPage /> },
      { path: "payments/:orderId/fail", element: <PaymentFailPage /> },
      { path: "orders", element: <OrderListPage /> },
      { path: "orders/:orderId", element: <OrderDetailPage /> },
      { path: "me", element: <MyPage /> },
      { path: "me/edit", element: <MemberEditPage /> },
      { path: "members/:memberId", element: <MemberProfilePage /> },
      { path: "member-reports/new", element: <MemberReportCreatePage /> },
      { path: "member-reports/me", element: <MemberReportHistoryPage /> },
      { path: "notifications", element: <NotificationListPage /> },
      { path: "admin/member-reports", element: <AdminMemberReportListPage /> },
      {
        path: "admin/member-reports/:reportId",
        element: <AdminMemberReportDetailPage />,
      },
      {
        path: "admin/member-restrictions",
        element: <AdminMemberRestrictionListPage />,
      },
      { path: "seller/register", element: <SellerRegisterPage /> },
      { path: "seller/products", element: <SellerProductListPage /> },
      { path: "seller/products/new", element: <SellerProductCreatePage /> },
      { path: "auctions", element: <AuctionListPage /> },
      { path: "auctions/:auctionId", element: <AuctionDetailPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
