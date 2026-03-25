import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import Layout from './components/layout/Layout'
import ProductListPage from './pages/product/ProductListPage'
import ProductDetailPage from './pages/product/ProductDetailPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'  
import CartPage from "./pages/cart/CartPage";
import DepositPage from "./pages/deposit/DepositPage";
import CheckoutPage from "./pages/order/CheckoutPage";
import OrderListPage from "./pages/order/OrderListPage";
import OrderDetailPage from "./pages/order/OrderDetailPage";
import MyPage from "./pages/member/MyPage";
import SellerRegisterPage from "./pages/seller/SellerRegisterPage";
import SellerProductCreatePage from "./pages/seller/SellerProductCreatePage";
import SellerProductListPage from "./pages/seller/SellerProductListPage";


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
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "deposits",
        element: <DepositPage />,
      },
      {
        path: "orders/checkout",
        element: <CheckoutPage />,
      },
      {
        path: "orders",
        element: <OrderListPage />,
      },
      {
        path: "orders/:orderId",
        element: <OrderDetailPage />,
      },
      {
        path: "me",
        element: <MyPage />,
      },
      {
        path: "seller/register",
        element: <SellerRegisterPage />,
      },
      {
        path: "seller/products",
        element: <SellerProductListPage />,
      },
      {
        path: "seller/products/new",
        element: <SellerProductCreatePage />,
      },
    ],
  },
]);

function App() {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  )
}

export default App
