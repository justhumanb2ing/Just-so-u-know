"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Popover, PopoverPanel, PopoverTrigger } from "@/components/animate-ui/components/base/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OgCrawlController } from "@/hooks/use-og-crawl";
import { cn } from "@/lib/utils";

type ItemComposerBarProps = {
  hasDraft: boolean;
  onOpenComposer: () => void;
  ogController: OgCrawlController;
  appearDelayMs?: number;
};

/**
 * 페이지 하단에 고정되는 아이템 작성 바.
 * 현재는 텍스트 아이템 작성과 링크 OG 조회를 함께 제공한다.
 */
export function ItemComposerBar({ hasDraft, onOpenComposer, ogController, appearDelayMs = 0 }: ItemComposerBarProps) {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    if (!portalRoot) {
      return;
    }

    if (shouldReduceMotion || appearDelayMs <= 0) {
      setIsVisible(true);
      return;
    }

    setIsVisible(false);
    const timerId = window.setTimeout(() => {
      setIsVisible(true);
    }, appearDelayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [portalRoot, shouldReduceMotion, appearDelayMs]);

  if (!portalRoot || !isVisible) {
    return null;
  }

  return createPortal(
    <motion.div
      className="fixed inset-x-0 bottom-4 z-30 mx-auto w-full max-w-md px-4"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 64 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <section className="space-y-2 rounded-[20px] border bg-background/80 p-2 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <PopoverTrigger
              render={
                <Button type="button" variant={"default"} className={"phantom-border"}>
                  Link
                </Button>
              }
            ></PopoverTrigger>
            <PopoverPanel sideOffset={8} className="w-[min(20rem,calc(100vw-2rem))] space-y-2 rounded-lg border-border/50 p-0">
              <form
                className="w-full"
                onSubmit={(event) => {
                  ogController.handleSubmitOgLookup(event, {
                    onSuccess: () => {
                      setIsLinkPopoverOpen(false);
                    },
                  });
                }}
              >
                <Input
                  value={ogController.linkUrl}
                  onChange={ogController.handleLinkUrlChange}
                  placeholder="Enter Link"
                  className="h-12 border-none px-3 shadow-none placeholder:text-neutral-400 focus:border-input focus:ring-0 focus-visible:border-input focus-visible:ring-0"
                  inputMode="url"
                  autoComplete="off"
                  disabled={ogController.isPending}
                  aria-label="Link URL"
                />
              </form>
            </PopoverPanel>
          </Popover>
          <Button
            type="button"
            variant="default"
            onClick={onOpenComposer}
            className={cn("phantom-border gap-1.5", hasDraft ? "border-primary/60" : undefined)}
          >
            Memo
          </Button>
        </div>
      </section>
    </motion.div>,
    portalRoot,
  );
}
