import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import AdminNav from "./AdminNav";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  useEffect(() => {
    const rootElement = document.getElementById("root");
    rootElement?.classList.add("admin-shell");

    return () => {
      rootElement?.classList.remove("admin-shell");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <AdminSidebar />

      {/* 사이드바(w-56=14rem) + 상단 nav(h-14=3.5rem) 만큼 offset */}
      <main className="min-h-screen pt-14 lg:pl-56">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
