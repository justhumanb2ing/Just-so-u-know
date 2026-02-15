"use client";

import { useEffect, useState } from "react";
import {
  type EditableSocialAccountInitialItem,
  EditableSocialAccountsSection,
} from "@/components/public-page/editable-social-accounts-section";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

type SocialAccountsSheetProps = {
  contentId: string;
  handle: string;
  initialItems: EditableSocialAccountInitialItem[];
  onPersistedItemsChange?: (items: EditableSocialAccountInitialItem[]) => void;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
};

/**
 * 소셜 계정 편집 UI를 툴바에서 진입 가능한 Drawer로 제공한다.
 */
export function SocialAccountsSheet({
  contentId,
  handle,
  initialItems,
  onPersistedItemsChange,
  open,
  onOpenChange,
}: SocialAccountsSheetProps) {
  const [persistedInitialItems, setPersistedInitialItems] = useState<EditableSocialAccountInitialItem[]>(initialItems);

  useEffect(() => {
    setPersistedInitialItems(initialItems);
  }, [initialItems]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent
        id={contentId}
        className="rounded-t-[2.5rem]! data-[vaul-drawer-direction=bottom]:mx-auto data-[vaul-drawer-direction=bottom]:h-[80vh] data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:w-full data-[vaul-drawer-direction=bottom]:max-w-md md:data-[vaul-drawer-direction=bottom]:h-[60vh] md:data-[vaul-drawer-direction=bottom]:max-h-[60vh]"
      >
        <DrawerHeader className="pt-8 pl-5 text-left">
          <DrawerTitle className="font-semibold text-lg leading-tight">Connect social platforms to your page</DrawerTitle>
          <DrawerDescription className="sr-only">Manage your social platform links.</DrawerDescription>
        </DrawerHeader>

        <div className="scrollbar-hide no-scrollbar flex min-h-0 flex-1 overflow-y-auto px-4 pb-3">
          <div className="mx-auto w-full max-w-[424px]">
            <EditableSocialAccountsSection
              handle={handle}
              initialItems={persistedInitialItems}
              onPersistedItemsChange={(items) => {
                setPersistedInitialItems(items);
                onPersistedItemsChange?.(items);
              }}
              onSaveSuccess={() => {
                onOpenChange(false);
              }}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
