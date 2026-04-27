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
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
    ghost: "bg-transparent text-blue-600 hover:bg-blue-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
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
        "inline-flex items-center justify-center transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
