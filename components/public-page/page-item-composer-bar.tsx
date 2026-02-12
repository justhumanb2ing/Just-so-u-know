"use client";

import { useState } from "react";
import { Popover, PopoverPanel, PopoverTrigger } from "@/components/animate-ui/components/base/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OgCrawlController } from "@/hooks/use-og-crawl";
import { cn } from "@/lib/utils";

type ItemComposerBarProps = {
  hasDraft: boolean;
  onOpenComposer: () => void;
  ogController: OgCrawlController;
};

/**
 * 페이지 하단에 고정되는 아이템 작성 바.
 * 현재는 텍스트 아이템 작성과 링크 OG 조회를 함께 제공한다.
 */
export function ItemComposerBar({ hasDraft, onOpenComposer, ogController }: ItemComposerBarProps) {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 mx-auto w-full max-w-lg px-4">
      <section className="space-y-2 rounded-[20px] border bg-background/90 p-3 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <PopoverTrigger render={<Button type="button" size="sm" variant="secondary" />}>Add Link</PopoverTrigger>
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
            size="sm"
            variant="outline"
            onClick={onOpenComposer}
            className={cn("gap-1.5", hasDraft ? "border-primary/60" : undefined)}
          >
            Add Item
          </Button>
        </div>
      </section>
    </div>
  );
}
