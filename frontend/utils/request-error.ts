import type { Locale } from "@/constants";

const NETWORK_ERROR_MESSAGES = new Set([
  "Failed to fetch",
  "Network Error",
  "Load failed",
  "NetworkError when attempting to fetch resource.",
]);

const NETWORK_ERROR_TEXT: Record<Locale, string> = {
  zh: "网络请求失败",
  en: "Network request failed",
};

type LocalizedRequestErrorOptions = {
  message?: string | null;
  routeLocale?: string;
  zhFallback: string;
  enFallback: string;
};

function resolveLocale(routeLocale?: string): Locale {
  if (routeLocale === "zh" || routeLocale === "en") {
    return routeLocale;
  }

  if (typeof navigator !== "undefined") {
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith("en")) {
      return "en";
    }
    if (browserLanguage.startsWith("zh")) {
      return "zh";
    }
  }

  return "zh";
}

export function localizeRequestError({
  message,
  routeLocale,
  zhFallback,
  enFallback,
}: LocalizedRequestErrorOptions): string {
  const locale = resolveLocale(routeLocale);
  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (!normalizedMessage) {
    return locale === "en" ? enFallback : zhFallback;
  }

  if (NETWORK_ERROR_MESSAGES.has(normalizedMessage)) {
    return NETWORK_ERROR_TEXT[locale];
  }

  return normalizedMessage;
}
