"use client";

import { AtSignIcon, Settings2Icon } from "lucide-react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useId, useState } from "react";
import { Popover, PopoverPanel, PopoverTrigger } from "@/components/animate-ui/components/base/popover";
import { Tooltip, TooltipPanel, TooltipTrigger } from "@/components/animate-ui/components/base/tooltip";
import type { EditableSocialAccountInitialItem } from "@/components/public-page/editable-social-accounts-section";
import { PageOwnerAccountActions } from "@/components/public-page/page-owner-account-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const loadPageSettingsSheet = () => import("@/components/public-page/page-settings-sheet");
const LazyPageSettingsSheet = dynamic(() => loadPageSettingsSheet().then((module) => module.PageSettingsSheet));
const loadSocialAccountsSheet = () => import("@/components/public-page/social-accounts-sheet");
const LazySocialAccountsSheet = dynamic(() => loadSocialAccountsSheet().then((module) => module.SocialAccountsSheet));

type OwnerActionFloatingToolbarProps = {
  handle: string;
  initialIsPublic: boolean;
  initialSocialItems: EditableSocialAccountInitialItem[];
  onSocialItemsChange?: (items: EditableSocialAccountInitialItem[]) => void;
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

/**
 * 계정 관련 액션(Sign out/Delete account)을 Popover로 묶어 오동작을 줄인다.
 */
function AccountActionsPopoverAction() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <motion.button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="dialog"
            whileTap={TOOLBAR_BUTTON_TAP}
            transition={TOOLBAR_BUTTON_TRANSITION}
            className={cn(buttonVariants({ variant: "default", size: "sm" }), "phantom-border rounded-full px-3")}
          >
            account
          </motion.button>
        }
      />
      <PopoverPanel side="top" align="start" sideOffset={8} className="w-auto min-w-0 rounded-xl border-border/50 p-2">
        <PageOwnerAccountActions />
      </PopoverPanel>
    </Popover>
  );
}

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
 * 소유자 액션(페이지 설정/소셜 관리/계정 액션) 진입점을 하단 고정 툴바로 제공한다.
 */
export function OwnerActionFloatingToolbar({
  handle,
  initialIsPublic,
  initialSocialItems,
  onSocialItemsChange,
}: OwnerActionFloatingToolbarProps) {
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

      <AccountActionsPopoverAction />

      {isSocialAccountsSheetReady ? (
        <LazySocialAccountsSheet
          contentId={socialAccountsSheetId}
          handle={handle}
          initialItems={initialSocialItems}
          onPersistedItemsChange={onSocialItemsChange}
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
