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
    primary: "bg-brand text-black hover:bg-brand-hover",
    secondary: "bg-sand text-plum hover:bg-warm",
    ghost: "bg-transparent text-plum hover:bg-sand",
    danger: "bg-[#9e0a0a] text-white hover:bg-[#7a0808]",
  };

  const sizes = {
    sm: "h-9 px-4 text-xs rounded-pin",
    md: "h-11 px-5 text-sm rounded-pin",
    lg: "h-13 px-6 text-sm rounded-pin font-bold",
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
