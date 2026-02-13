"use client";

import { AtSignIcon, Settings2Icon } from "lucide-react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useId, useState } from "react";
import { Tooltip, TooltipPanel, TooltipTrigger } from "@/components/animate-ui/components/base/tooltip";
import type { EditableSocialAccountInitialItem } from "@/components/public-page/editable-social-accounts-section";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const loadPageSettingsSheet = () => import("@/components/public-page/page-settings-sheet");
const LazyPageSettingsSheet = dynamic(() => loadPageSettingsSheet().then((module) => module.PageSettingsSheet));
const loadSocialAccountsSheet = () => import("@/components/public-page/social-accounts-sheet");
const LazySocialAccountsSheet = dynamic(() => loadSocialAccountsSheet().then((module) => module.SocialAccountsSheet));

type PageEditFloatingToolbarProps = {
  handle: string;
  initialIsPublic: boolean;
  initialSocialItems: EditableSocialAccountInitialItem[];
};

type MotionToolbarButtonProps = {
  controlsId: string;
  expanded: boolean;
  label: string;
  tooltipText: string;
  onPreload: () => void;
  onOpen: () => void;
  children: ReactNode;
};

const TOOLBAR_BUTTON_TAP = { scale: 0.92 } as const;
const TOOLBAR_BUTTON_TRANSITION = {
  duration: 0.12,
  ease: "easeOut",
} as const;

function MotionToolbarButton({ controlsId, expanded, label, tooltipText, onPreload, onOpen, children }: MotionToolbarButtonProps) {
  return (
    <Tooltip delay={100}>
      <TooltipTrigger
        render={
          <motion.button
            type="button"
            aria-label={label}
            aria-haspopup="dialog"
            aria-expanded={expanded}
            aria-controls={controlsId}
            onMouseEnter={onPreload}
            onFocus={onPreload}
            onClick={onOpen}
            whileTap={TOOLBAR_BUTTON_TAP}
            transition={TOOLBAR_BUTTON_TRANSITION}
            className={cn(buttonVariants({ variant: "default", size: "icon-sm" }), "phantom-border rounded-full")}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipPanel side="top" align="center">
        {tooltipText}
      </TooltipPanel>
    </Tooltip>
  );
}

/**
 * 페이지 편집 도구 진입점을 하단 고정 툴바로 제공한다.
 */
export function PageEditFloatingToolbar({ handle, initialIsPublic, initialSocialItems }: PageEditFloatingToolbarProps) {
  const settingsSheetId = useId();
  const socialAccountsSheetId = useId();
  const [isSettingsSheetReady, setIsSettingsSheetReady] = useState(false);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isSocialAccountsSheetReady, setIsSocialAccountsSheetReady] = useState(false);
  const [isSocialAccountsSheetOpen, setIsSocialAccountsSheetOpen] = useState(false);

  const preloadSettingsSheet = useCallback(() => {
    void loadPageSettingsSheet();
  }, []);

  const preloadSocialAccountsSheet = useCallback(() => {
    void loadSocialAccountsSheet();
  }, []);

  const handleOpenSettingsSheet = useCallback(() => {
    setIsSettingsSheetReady(true);
    setIsSettingsSheetOpen(true);
  }, []);

  const handleOpenSocialAccountsSheet = useCallback(() => {
    setIsSocialAccountsSheetReady(true);
    setIsSocialAccountsSheetOpen(true);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 px-4 supports-[padding:max(0px)]:bottom-[max(1rem,env(safe-area-inset-bottom))]">
      <MotionToolbarButton
        controlsId={socialAccountsSheetId}
        expanded={isSocialAccountsSheetOpen}
        label="Open social accounts drawer"
        tooltipText="Social Platforms"
        onPreload={preloadSocialAccountsSheet}
        onOpen={handleOpenSocialAccountsSheet}
      >
        <AtSignIcon aria-hidden="true" className="size-4" />
      </MotionToolbarButton>

      <MotionToolbarButton
        controlsId={settingsSheetId}
        expanded={isSettingsSheetOpen}
        label="Open page settings drawer"
        tooltipText="Settings"
        onPreload={preloadSettingsSheet}
        onOpen={handleOpenSettingsSheet}
      >
        <Settings2Icon aria-hidden="true" className="size-4" />
      </MotionToolbarButton>

      {isSocialAccountsSheetReady ? (
        <LazySocialAccountsSheet
          contentId={socialAccountsSheetId}
          handle={handle}
          initialItems={initialSocialItems}
          open={isSocialAccountsSheetOpen}
          onOpenChange={setIsSocialAccountsSheetOpen}
        />
      ) : null}

      {isSettingsSheetReady ? (
        <LazyPageSettingsSheet
          contentId={settingsSheetId}
          handle={handle}
          initialIsPublic={initialIsPublic}
          open={isSettingsSheetOpen}
          onOpenChange={setIsSettingsSheetOpen}
        />
      ) : null}
    </div>
  );
}
