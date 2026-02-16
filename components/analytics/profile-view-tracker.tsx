"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { isHandlePathname } from "@/service/analytics/schema";
import { trackProfileView } from "@/service/analytics/tracker";

type ProfileViewTrackerProps = {
  pageId: string;
  isOwner: boolean;
  isPublic: boolean;
};

function resolveEntryPath(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

/**
 * 공개 페이지(`/{handle}`) 전용 방문 이벤트를 page_id 기준으로 기록한다.
 */
export function ProfileViewTracker({ pageId, isOwner, isPublic }: ProfileViewTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackedKeyRef = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    if (!pathname || !isHandlePathname(pathname)) {
      return;
    }

    const entryPath = resolveEntryPath(pathname, search);
    const trackingKey = `${pageId}:${entryPath}`;

    if (trackedKeyRef.current === trackingKey) {
      return;
    }

    trackProfileView({
      pageId,
      isOwner,
      isPublic,
      entryPath,
    });
    trackedKeyRef.current = trackingKey;
  }, [pageId, isOwner, isPublic, pathname, search]);

  return null;
}
