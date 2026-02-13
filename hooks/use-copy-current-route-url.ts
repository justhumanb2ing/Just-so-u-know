"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

type BuildAbsoluteRouteUrlParams = {
  origin: string;
  pathname: string;
  search: string;
  hash: string;
};

/**
 * path/search/hash 조각을 절대 URL 문자열로 정규화한다.
 */
export function buildAbsoluteRouteUrl({ origin, pathname, search, hash }: BuildAbsoluteRouteUrlParams) {
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalizedSearch = search ? (search.startsWith("?") ? search : `?${search}`) : "";
  const normalizedHash = hash ? (hash.startsWith("#") ? hash : `#${hash}`) : "";

  return `${origin}${normalizedPathname}${normalizedSearch}${normalizedHash}`;
}

export type UseCopyCurrentRouteUrlResult = {
  currentRouteUrl: string | null;
  copyCurrentRouteUrl: () => Promise<boolean>;
};

/**
 * 현재 App Router URL을 계산하고 클립보드 복사 액션을 제공한다.
 */
export function useCopyCurrentRouteUrl(): UseCopyCurrentRouteUrlResult {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const currentRouteUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return buildAbsoluteRouteUrl({
      origin: window.location.origin,
      pathname,
      search,
      hash: window.location.hash,
    });
  }, [pathname, search]);

  const copyCurrentRouteUrl = useCallback(async () => {
    if (!currentRouteUrl) {
      return false;
    }

    if (!("clipboard" in navigator) || typeof navigator.clipboard?.writeText !== "function") {
      toast.error("Clipboard unavailable", {
        description: "Your browser does not support clipboard copy.",
      });
      return false;
    }

    try {
      await navigator.clipboard.writeText(currentRouteUrl);
      return true;
    } catch {
      toast.error("Copy failed", {
        description: "Unable to copy the current page URL.",
      });
      return false;
    }
  }, [currentRouteUrl]);

  return {
    currentRouteUrl,
    copyCurrentRouteUrl,
  };
}
