"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { isHandlePathname } from "@/service/analytics/schema";
import { trackPageView } from "@/service/analytics/tracker";

function resolveRouteTrackingKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * 전역 pageview를 수동 수집한다.
 * `/[handle]` 라우트는 `profile_view` 이벤트로만 측정하기 위해 제외한다.
 */
export function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedKeyRef = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    if (!pathname || isHandlePathname(pathname)) {
      return;
    }

    const trackingKey = resolveRouteTrackingKey(pathname, search);

    if (lastTrackedKeyRef.current === trackingKey) {
      return;
    }

    trackPageView();
    lastTrackedKeyRef.current = trackingKey;
  }, [pathname, search]);

  return null;
}
