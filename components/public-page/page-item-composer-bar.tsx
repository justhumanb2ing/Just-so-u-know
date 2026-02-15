"use client";

import { ImagePlayIcon, LinkIcon, MapIcon, StickyNoteIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { type ChangeEvent, type ComponentProps, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Popover, PopoverPanel, PopoverTrigger } from "@/components/animate-ui/components/base/popover";
import { Tooltip, TooltipPanel, TooltipTrigger } from "@/components/animate-ui/components/base/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OgCrawlController } from "@/hooks/use-og-crawl";
import type { MapItemCreatePayload } from "@/hooks/use-page-item-composer";
import { cn } from "@/lib/utils";
import { PAGE_ITEM_MEDIA_ALLOWED_MIME_TYPES } from "@/service/page/item-media";
import { Separator } from "../ui/separator";
import { PageSaveStatusIndicator } from "./page-save-status-indicator";

const PageItemLocationDialog = dynamic(() => import("./page-item-location-dialog").then((module) => module.PageItemLocationDialog), {
  ssr: false,
});

type ItemComposerBarProps = {
  hasDraft: boolean;
  onOpenComposer: () => void;
  ogController: OgCrawlController;
  onSaveMapItem: (payload: MapItemCreatePayload) => Promise<boolean>;
  onCreateMediaItemFromFile: (file: File) => Promise<boolean>;
  appearDelayMs?: number;
};

type ComposerActionButtonProps = Omit<ComponentProps<typeof motion.button>, "type">;
type ComposerTooltipButtonProps = ComposerActionButtonProps & {
  tooltipText: string;
};

const COMPOSER_BUTTON_TAP = { scale: 0.92 } as const;
const COMPOSER_BUTTON_TRANSITION = {
  duration: 0.12,
  ease: "easeOut",
} as const;
const PAGE_ITEM_MEDIA_INPUT_ACCEPT = Array.from(PAGE_ITEM_MEDIA_ALLOWED_MIME_TYPES).join(",");

function ComposerActionButton({ className, ...props }: ComposerActionButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={COMPOSER_BUTTON_TAP}
      transition={COMPOSER_BUTTON_TRANSITION}
      className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "phantom-border", className)}
      {...props}
    />
  );
}

function ComposerTooltipButton({ tooltipText, ...props }: ComposerTooltipButtonProps) {
  return (
    <Tooltip delay={0}>
      <TooltipTrigger render={<ComposerActionButton {...props} />} />
      <TooltipPanel side="top" align="center">
        {tooltipText}
      </TooltipPanel>
    </Tooltip>
  );
}

/**
 * 페이지 하단에 고정되는 아이템 작성 바.
 * 현재는 텍스트 아이템 작성과 링크 OG 조회를 함께 제공한다.
 */
export function ItemComposerBar({
  hasDraft,
  onOpenComposer,
  ogController,
  onSaveMapItem,
  onCreateMediaItemFromFile,
  appearDelayMs = 0,
}: ItemComposerBarProps) {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMediaUploadPending, setIsMediaUploadPending] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const shouldReduceMotion = useReducedMotion() ?? false;

  const handleMediaInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || isMediaUploadPending) {
      event.target.value = "";
      return;
    }

    setIsMediaUploadPending(true);

    try {
      const hasCreated = await onCreateMediaItemFromFile(selectedFile);

      if (!hasCreated) {
        return;
      }
    } catch {
      toast.error("Failed to upload media", {
        description: "Please try again.",
      });
    } finally {
      setIsMediaUploadPending(false);
      event.target.value = "";
    }
  };

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
      className="fixed inset-x-0 bottom-4 z-30 mx-auto w-full max-w-fit px-4"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 64 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <section className="floating-shadow flex items-center gap-2 rounded-[16px] border-[0.5px] border-border bg-background/80 p-2 shadow-xl backdrop-blur-sm">
        <PageSaveStatusIndicator />
        <Separator orientation="vertical" className={"my-3 rounded-lg data-vertical:w-0.5"} />
        <div className="flex items-center gap-1">
          <input
            ref={mediaInputRef}
            type="file"
            accept={PAGE_ITEM_MEDIA_INPUT_ACCEPT}
            className="sr-only"
            onChange={handleMediaInputChange}
            disabled={isMediaUploadPending}
            aria-hidden="true"
            tabIndex={-1}
          />
          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <Tooltip delay={0}>
              <TooltipTrigger
                render={
                  <PopoverTrigger
                    render={
                      <ComposerActionButton aria-label="Open link composer">
                        <LinkIcon className="size-5" strokeWidth={2.5} />
                      </ComposerActionButton>
                    }
                  />
                }
              />
              <TooltipPanel side="top" align="center">
                Link
              </TooltipPanel>
            </Tooltip>
            <PopoverPanel sideOffset={16} className="w-[min(20rem,calc(100vw-2rem))] space-y-2 rounded-lg border-border/50 p-0">
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
          <ComposerTooltipButton
            aria-label="Open memo composer"
            tooltipText="Memo"
            onClick={onOpenComposer}
            className={cn("gap-1.5", hasDraft ? "border-primary/60" : undefined)}
          >
            <StickyNoteIcon className="size-5" strokeWidth={2.5} />
          </ComposerTooltipButton>
          <ComposerTooltipButton
            aria-label="Add image and video item"
            tooltipText="Image&Video"
            className={cn("gap-1.5")}
            disabled={isMediaUploadPending}
            onClick={() => {
              if (isMediaUploadPending) {
                return;
              }

              mediaInputRef.current?.click();
            }}
          >
            <ImagePlayIcon className="size-5" strokeWidth={2.5} />
          </ComposerTooltipButton>
          <PageItemLocationDialog
            onSaveMapItem={onSaveMapItem}
            trigger={
              <ComposerActionButton aria-label="Add location item" className={cn("gap-1.5")}>
                <MapIcon className="size-5" strokeWidth={2.5} />
              </ComposerActionButton>
            }
          />
        </div>
      </section>
    </motion.div>,
    portalRoot,
  );
}
