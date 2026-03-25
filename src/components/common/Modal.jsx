import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="모달 닫기"
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-[101] w-full max-w-md overflow-hidden rounded-[28px]",
          "border border-white/30 bg-white/85 shadow-2xl backdrop-blur-xl"
        )}
      >
        <div className="space-y-2 px-6 pt-6">
          {title ? (
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-6 text-gray-600">{description}</p>
          ) : null}
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}