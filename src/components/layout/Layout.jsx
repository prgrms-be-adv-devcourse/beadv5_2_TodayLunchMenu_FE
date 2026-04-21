import { Outlet } from "react-router-dom";
import ToastViewport from "../common/ToastViewport";
import { useNotificationSse } from "../../features/notification/useNotificationSse";
import AppHeader from "./AppHeader";

export default function Layout() {
  useNotificationSse();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader />
      <ToastViewport />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
