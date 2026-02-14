"use client";

import { LoaderIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCopyCurrentRouteUrl } from "@/hooks/use-copy-current-route-url";
import { cn } from "@/lib/utils";

const COPY_SUCCESS_VISIBLE_MS = 1500;

type CopyButtonStatus = "idle" | "pending" | "success";
type CopyUrlButtonProps = Pick<ComponentProps<typeof Button>, "className" | "size" | "variant">;

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
  const { copyCurrentRouteUrl } = useCopyCurrentRouteUrl();
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

    setStatus("success");
    resetTimerRef.current = setTimeout(() => {
      setStatus("idle");
      resetTimerRef.current = null;
    }, COPY_SUCCESS_VISIBLE_MS);
  }, [copyCurrentRouteUrl, status]);

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
