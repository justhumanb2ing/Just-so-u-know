"use client";

import { GlobeIcon, LoaderIcon, LockIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { useCallback, useState, useTransition } from "react";
import { togglePageVisibilityAction } from "@/app/[handle]/actions";
import { EditablePageHandleForm } from "@/components/public-page/editable-page-handle-form";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@/lib/utils";

type PageSettingsSheetProps = {
  contentId: string;
  handle: string;
  initialIsPublic: boolean;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
};

/**
 * 공개 상태 토글은 서버의 원자적 토글 액션 결과를 단일 진실 공급원으로 사용해 동기화한다.
 */
export function PageSettingsSheet({ contentId, handle, initialIsPublic, open, onOpenChange }: PageSettingsSheetProps) {
  const isMobile = useIsMobile();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [_visibilityFeedback, setVisibilityFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibilityLabel = isPublic ? "Public" : "Private";
  const visibilityDescription = isPublic ? "Anyone can open and view your page." : "Only you can access this page while signed in.";

  /**
   * Switch의 boolean 변경값과 Button 클릭 이벤트를 모두 받아 공개 상태 토글을 처리한다.
   */
  const handleVisibilityCheckedChange = useCallback(
    (nextCheckedOrEvent?: boolean | MouseEvent<HTMLButtonElement>) => {
      const nextChecked = typeof nextCheckedOrEvent === "boolean" ? nextCheckedOrEvent : !isPublic;

      if (isPending || nextChecked === isPublic) {
        return;
      }

      setVisibilityFeedback(null);
      startTransition(async () => {
        const result = await togglePageVisibilityAction({ handle });

        if (result.status === "error") {
          setVisibilityFeedback(result.message);
          return;
        }

        setIsPublic(result.isPublic);
        setVisibilityFeedback(result.isPublic ? "Your page is now public." : "Your page is now private.");
      });
    },
    [handle, isPending, isPublic],
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
      <DrawerContent
        id={contentId}
        className="h-[86dvh] max-h-[86dvh] overflow-hidden data-[vaul-drawer-direction=bottom]:mx-auto data-[vaul-drawer-direction=bottom]:w-full data-[vaul-drawer-direction=bottom]:max-w-md data-[vaul-drawer-direction=bottom]:rounded-t-[2.5rem]! sm:h-dvh sm:max-h-dvh"
      >
        <DrawerHeader className="pt-8 pl-5 text-left">
          <DrawerTitle className="font-semibold text-xl">Settings</DrawerTitle>
          <DrawerDescription className="sr-only">Update your page handle and visibility.</DrawerDescription>
        </DrawerHeader>

        <div className="scrollbar-hide no-scrollbar flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-5 py-2 pb-12">
          <section className="flex flex-col gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-medium text-base">Who can see your page?</h2>
              <p className="mt-1 text-muted-foreground text-xs">{visibilityDescription}</p>
            </div>
            <Button
              type="button"
              size={"lg"}
              variant={"default"}
              className="phantom-border py-6 text-lg text-white"
              onClick={handleVisibilityCheckedChange}
              aria-label="Toggle page visibility"
            >
              {isPending ? (
                <LoaderIcon aria-hidden="true" className="size-3.5 animate-spin" />
              ) : isPublic ? (
                <GlobeIcon aria-hidden="true" className="size-3.5 text-green-500" />
              ) : (
                <LockIcon aria-hidden="true" className="size-3.5 text-red-500" />
              )}
              {!isPending && <span className={cn("font-medium", isPublic ? "text-green-500" : "text-red-500")}>{visibilityLabel}</span>}
            </Button>
          </section>

          <section>
            <h2 className="font-medium text-base">Looking for another handle?</h2>
            <div className="mt-1">
              <EditablePageHandleForm handle={handle} />
            </div>
          </section>
        </div>

        <DrawerFooter className="scroll-affordance-top z-10 border-border/40 border-t bg-background/95 pt-4">
          <DrawerClose asChild>
            <Button type="button" size="lg" variant="default" className="py-6 text-lg">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
