"use client";

import { LoaderIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCopyCurrentRouteUrl } from "@/hooks/use-copy-current-route-url";
import { cn } from "@/lib/utils";
import { trackFeatureUse } from "@/service/analytics/tracker";

const COPY_SUCCESS_VISIBLE_MS = 1500;

type CopyButtonStatus = "idle" | "pending" | "success";
type CopyUrlButtonProps = Pick<ComponentProps<typeof Button>, "className" | "size" | "variant">;

/**
 * 공유 이벤트 컨텍스트에 저장할 경로(path+query)를 URL 문자열에서 안전하게 추출한다.
 */
export function resolveShareTrackingPath(currentRouteUrl: string | null) {
  if (!currentRouteUrl) {
    return "/";
  }

  try {
    const parsedUrl = new URL(currentRouteUrl);
    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return "/";
  }
}

/**
 * 복사 진행 상태에 따라 표시할 아이콘을 반환한다.
 */
function CopyButtonIcon({ status }: { status: CopyButtonStatus }) {
  if (status === "pending") {
    return <LoaderIcon className="size-4 animate-spin" strokeWidth={3} />;
  }

  if (status === "success") {
    return <span>Copied!</span>;
  }

  return <span>Share</span>;
}

export default function CopyUrlButton({ className, size = "lg", variant = "default" }: CopyUrlButtonProps) {
  const { copyCurrentRouteUrl, currentRouteUrl } = useCopyCurrentRouteUrl();
  const [status, setStatus] = useState<CopyButtonStatus>("idle");
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  /**
   * URL 복사 상태를 idle -> pending -> success(1.5초) -> idle 순서로 관리한다.
   */
  const handleCopy = useCallback(async () => {
    if (status === "pending") {
      return;
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setStatus("pending");
    const copied = await copyCurrentRouteUrl();

    if (!copied) {
      setStatus("idle");
      return;
    }

    trackFeatureUse({
      featureName: "share_copy_url",
      actorType: "owner",
      context: {
        path: resolveShareTrackingPath(currentRouteUrl),
      },
    });

    setStatus("success");
    resetTimerRef.current = setTimeout(() => {
      setStatus("idle");
      resetTimerRef.current = null;
    }, COPY_SUCCESS_VISIBLE_MS);
  }, [copyCurrentRouteUrl, currentRouteUrl, status]);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("press-scale rounded-sm px-10 text-base", className)}
      aria-label="Copy current page URL"
      onClick={handleCopy}
      disabled={status === "pending"}
    >
      <span className="relative inline-flex size-4 items-center justify-center">
        <AnimatePresence initial={false}>
          <motion.span
            key={status}
            className="absolute inset-0 inline-flex items-center justify-center font-semibold"
            data-testid={`copy-url-icon-${status}`}
            initial={{ scale: 0.7, y: 2, opacity: 0.4, filter: "blur(4px)" }}
            animate={{ scale: 1, y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.7, y: -2, opacity: 0.4, filter: "blur(4px)" }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <CopyButtonIcon status={status} />
          </motion.span>
        </AnimatePresence>
      </span>
    </Button>
  );
}
