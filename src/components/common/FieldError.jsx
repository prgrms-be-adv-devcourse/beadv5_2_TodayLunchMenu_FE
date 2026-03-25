export default function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="mt-1 px-1 text-sm font-medium text-red-600">
      {message}
    </p>
  );
}