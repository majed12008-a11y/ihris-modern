import { useEffect, useState } from "react";

/** يؤخّر تحديث القيمة حتى يتوقف الإدخال — لمنع طلب لكل حرف. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
