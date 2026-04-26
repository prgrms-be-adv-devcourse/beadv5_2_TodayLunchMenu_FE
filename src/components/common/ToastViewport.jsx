import { useNavigate } from "react-router-dom";
import { useSyncExternalStore } from "react";

import { cn } from "../../utils/cn";
import {
  formatElapsedTime,
  getNotificationActionClassName,
  getNotificationTypeMeta,
  resolveNotificationActionPath,
} from "../../features/notification/notificationPresentation";
import {
  getToastState,
  removeToast,
  subscribeToastStore,
} from "../../features/notification/notificationToastStore";

function ToastActionButton({ toast, action, navigate }) {
  const targetPath = resolveNotificationActionPath(action, toast);
  const isClickable = Boolean(targetPath);

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => {
        if (!targetPath) {
          return;
        }

        removeToast(toast.id);
        navigate(targetPath);
      }}
      className={cn(
        "rounded-full px-3 py-1.5 text-[11px] font-bold transition",
        getNotificationActionClassName(action.variant),
        !isClickable && "cursor-not-allowed opacity-40"
      )}
    >
      {action.label}
    </button>
  );
}

function ToastMetaBadge({ children, className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700",
        className
      )}
    >
      {children}
    </span>
  );
}

function ToastCard({ toast, onDismiss, navigate }) {
  const meta = getNotificationTypeMeta(toast.notificationType || toast.tone);
  const elapsed = toast.elapsedTime || formatElapsedTime(toast);

  return (
    <article
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-[24px] border border-violet-100 bg-white p-4 text-left shadow-[0_16px_40px_rgba(93,63,211,0.14)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgba(93,63,211,0.18)]"
      )}
    >
      <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-[24px] bg-violet-600/90" />

      <div className="flex items-start gap-4 pl-2">
        <div
          className={cn(
            "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ring-1",
            meta.tone
          )}
        >
          {meta.icon}
        </div>

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-left">
              <ToastMetaBadge>{meta.label}</ToastMetaBadge>

              <h3 className="mt-3 text-sm font-extrabold tracking-tight text-slate-900">
                {toast.title}
              </h3>
              {toast.subtitle ? (
                <p className="mt-1 text-xs font-semibold text-violet-700/80">
                  {toast.subtitle}
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {elapsed ? (
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700/75">
                  {elapsed}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                aria-label="알림 닫기"
              >
                x
              </button>
            </div>
          </div>

          {toast.message ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {toast.message}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {toast.actions?.length > 0 ? (
              toast.actions.map((action) => (
                <ToastActionButton
                  key={`${toast.id}-${action.routeKey}-${action.label}`}
                  toast={toast}
                  action={action}
                  navigate={navigate}
                />
              ))
            ) : (
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  className="rounded-full bg-violet-100 px-3 py-1.5 text-[11px] font-bold text-violet-700 transition hover:bg-violet-200"
                >
                닫기
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ToastViewport() {
  const navigate = useNavigate();
  const { items } = useSyncExternalStore(subscribeToastStore, getToastState);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-6 top-20 z-[60] flex w-[calc(100vw-3rem)] max-w-[380px] flex-col gap-4 sm:right-8 sm:top-6">
      {items.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          navigate={navigate}
          onDismiss={removeToast}
        />
      ))}
    </div>
  );
}
