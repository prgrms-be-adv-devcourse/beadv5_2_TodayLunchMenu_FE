import { useCallback, useRef, useState } from "react";

export function useCartToast() {
  const [toast, setToast] = useState(null); // { message, error }
  const timerRef = useRef(null);

  const showToast = useCallback((message, error = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, error });
    timerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  return { toast, showToast };
}
