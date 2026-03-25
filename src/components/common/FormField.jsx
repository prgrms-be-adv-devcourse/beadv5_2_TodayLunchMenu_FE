import { cn } from "../../utils/cn";
import FieldError from "./FieldError";

export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  helpText,
  children,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className={cn(
            "ml-1 text-xs font-bold uppercase tracking-wider",
            error ? "text-red-600" : "text-gray-600"
          )}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {children}

      {error ? <FieldError message={error} /> : null}
      {!error && helpText ? (
        <p className="mt-1 px-1 text-sm text-gray-500">{helpText}</p>
      ) : null}
    </div>
  );
}