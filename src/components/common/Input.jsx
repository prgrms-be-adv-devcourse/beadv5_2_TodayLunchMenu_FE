import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Input = forwardRef(function Input(
  { className, error = false, disabled = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      disabled={disabled}
      aria-invalid={error}
      className={cn(
        "w-full h-14 rounded-xl px-4 outline-none transition",
        "bg-purple-100/70 text-gray-900 placeholder:text-gray-500/60",
        "focus:ring-2 focus:ring-violet-300",
        error &&
          "bg-red-50 text-red-950 placeholder:text-red-300 focus:ring-red-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    />
  );
});

export default Input;