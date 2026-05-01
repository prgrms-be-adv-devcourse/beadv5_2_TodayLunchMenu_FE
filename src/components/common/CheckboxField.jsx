import { cn } from "../../utils/cn";
import FieldError from "./FieldError";

export default function CheckboxField({
  id,
  checked,
  onChange,
  label,
  error,
  disabled = false,
}) {
  return (
    <div>
      <div className="flex items-start gap-3 px-1">
        <div className="mt-0.5 flex h-5 items-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
            className={cn(
              "h-5 w-5 rounded border-none",
              "bg-sand text-brand focus:ring-[#435ee5]",
              disabled && "cursor-not-allowed opacity-50"
            )}
          />
        </div>

        <label
          htmlFor={id}
          className={cn(
            "text-sm leading-tight",
            error ? "text-[#9e0a0a]" : "text-olive",
            disabled && "opacity-50"
          )}
        >
          {label}
        </label>
      </div>

      <FieldError message={error} />
    </div>
  );
}