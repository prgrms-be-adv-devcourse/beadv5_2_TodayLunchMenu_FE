import { cn } from "../../utils/cn";

export default function Button({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  className,
  disabled = false,
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-br from-violet-700 to-violet-600 text-white shadow-lg shadow-violet-500/20 hover:brightness-110",
    secondary:
      "bg-purple-100 text-violet-800 hover:bg-purple-200",
    ghost:
      "bg-transparent text-violet-700 hover:bg-purple-100",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "h-10 px-4 text-sm rounded-full",
    md: "h-12 px-5 text-sm rounded-full",
    lg: "h-14 px-6 text-base rounded-full font-bold",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center transition active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}