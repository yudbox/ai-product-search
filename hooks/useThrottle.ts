import { useCallback, useRef } from "react";

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // eslint-disable-next-line react-hooks/refs
  callbackRef.current = callback;

  return useCallback(
    (...args: unknown[]) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    },
    [delay],
  ) as T;
}
