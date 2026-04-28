import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import AdminNav from "./AdminNav";
import AdminSidebar from "./AdminSidebar";

function resolveCurrentPage(pathname) {
  if (pathname.startsWith("/admin/member-reports")) {
    return "reports";
  }
  if (pathname.startsWith("/admin/member-restrictions")) {
    return "sanctions";
  }
  if (pathname.startsWith("/admin/categories")) {
    return "categories";
  }
  if (pathname.startsWith("/admin/embeddings")) {
    return "embeddings";
  }
  return "dashboard";
}

export default function AdminLayout() {
  const location = useLocation();
  const currentPage = resolveCurrentPage(location.pathname);

  useEffect(() => {
    const rootElement = document.getElementById("root");
    rootElement?.classList.add("admin-shell");

    return () => {
      rootElement?.classList.remove("admin-shell");
    };
  }, []);

  return (
    <div className="min-h-screen ">
      <AdminNav currentPage={currentPage} />
      <AdminSidebar currentPage={currentPage} />

      <div className="flex min-h-screen">
        <main className="min-w-0 flex-1 px-4 pb-12 pt-24 lg:px-8 lg:pb-12 lg:pt-24">
          <div className="mx-auto w-full max-w-[1560px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
