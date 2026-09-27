import { useEffect, useState } from "react";

// A simple media query hook that returns whether the query matches
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    // Set initial value and subscribe to changes
    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener("change", listener);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}