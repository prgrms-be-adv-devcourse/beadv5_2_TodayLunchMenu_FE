import { Link } from "react-router-dom";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 w-full flex justify-around bg-white/70 backdrop-blur-xl rounded-t-3xl p-4">
      <Link to="/">홈</Link>
      <Link to="/products">상품</Link>
      <Link to="/orders">주문</Link>
      <Link to="/me">마이</Link>
    </nav>
  );
}