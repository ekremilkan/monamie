export type SupportedLocale = "de" | "en";

const DEFAULT_LOCALE: SupportedLocale = "de";

export const resolveLocale = (
  candidate?: string | null
): SupportedLocale => {
  if (!candidate) {
    return DEFAULT_LOCALE;
  }

  const normalized = candidate.toLowerCase();
  if (normalized.startsWith("de")) {
    return "de";
  }
  if (normalized.startsWith("en")) {
    return "en";
  }
  return DEFAULT_LOCALE;
};

export const getBrowserLocale = (): SupportedLocale => {
  if (typeof navigator === "undefined") {
    return DEFAULT_LOCALE;
  }
  return resolveLocale(navigator.language);
};
