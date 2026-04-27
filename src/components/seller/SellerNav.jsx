import { Link } from "react-router-dom";

function SellerNav({ currentPage = "products" }) {
  const isActive = (page) => currentPage === page;

  const navItems = [
    { id: "home", label: "대시보드", to: "/seller/me" },
    { id: "orders", label: "정산 대기 주문", to: "/seller/orders" },
    { id: "products", label: "상품 관리", to: "/seller/products" },
    { id: "settlements", label: "정산", to: "/seller/settlements" },
    { id: "refunds", label: "환불 관리", to: "/seller/refunds" },
  ];

  return (
    <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-violet-100 bg-[#fdf3ff]/80 px-6 py-3 backdrop-blur-xl shadow-sm">
      <div className="flex items-center gap-8">
        <Link
          to="/seller/me"
          className="text-xl font-black tracking-tight text-violet-700 hover:opacity-80 transition-opacity"
        >
          판매자 센터
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => {
            const isCurrentActive = isActive(item.id);
            const className = `font-semibold transition-colors ${
              isCurrentActive
                ? "text-violet-700 relative after:absolute after:-bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-violet-600"
                : "text-slate-500 hover:text-violet-500"
            }`;

            return (
              <Link key={item.id} to={item.to} className={className}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default SellerNav;
