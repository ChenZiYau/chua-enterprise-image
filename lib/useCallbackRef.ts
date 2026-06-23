import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable function identity that always invokes the latest version of
 * `callback`. Handy for effect cleanups that shouldn't re-run when a handler
 * prop changes identity between renders.
 */
export function useCallbackRef<A extends unknown[], R>(
  callback: (...args: A) => R,
): (...args: A) => R {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  return useCallback((...args: A) => ref.current(...args), []);
}
