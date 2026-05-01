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
        "w-full h-14 rounded-pin px-4 outline-none transition",
        "border border-silver bg-white text-plum placeholder:text-silver",
        "focus:ring-2 focus:ring-[#435ee5] focus:border-[#435ee5]",
        error &&
          "border-[#9e0a0a] bg-red-50 text-red-950 placeholder:text-red-300 focus:ring-[#9e0a0a]",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    />
  );
});

export default Input;