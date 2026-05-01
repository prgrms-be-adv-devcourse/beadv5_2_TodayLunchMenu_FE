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
              "bg-purple-200 text-violet-700 focus:ring-violet-300",
              disabled && "cursor-not-allowed opacity-50"
            )}
          />
        </div>

        <label
          htmlFor={id}
          className={cn(
            "text-sm leading-tight",
            error ? "text-red-600" : "text-gray-600",
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