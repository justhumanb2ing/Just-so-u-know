"use client";

import { useCallback, useState } from "react";
import type { ConnectedSocialItem } from "@/components/public-page/connected-social-items-model";
import { EditablePageContent } from "@/components/public-page/editable-page-content";
import { OwnerActionFloatingToolbar } from "@/components/public-page/page-edit-floating-toolbar";
import { PageSaveStatusIndicator } from "@/components/public-page/page-save-status-indicator";
import { PublicPageShell } from "@/components/public-page/public-page-shell";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useIsMobileWebRuntime } from "@/hooks/use-is-mobile-web-runtime";
import type { InitialPageItem } from "@/hooks/use-page-item-composer";
import { PageSaveStatusProvider } from "@/hooks/use-page-save-status";

type EditablePageOwnerSectionProps = {
  handle: string;
  initialIsPublic: boolean;
  initialName: string | null;
  initialBio: string | null;
  initialImage: string | null;
  initialItems: InitialPageItem[];
  initialSocialItems: ConnectedSocialItem[];
};

type ResolveShouldHideOwnerHandleParams = {
  isMobileViewport: boolean;
  isMobileWebRuntime: boolean;
};

/**
 * 소셜 아이템 목록이 실제로 바뀐 경우에만 상태를 교체해 불필요한 리렌더를 방지한다.
 */
function areSocialItemsEqual(leftItems: ConnectedSocialItem[], rightItems: ConnectedSocialItem[]) {
  if (leftItems.length !== rightItems.length) {
    return false;
  }

  return leftItems.every(
    (leftItem, index) => leftItem.platform === rightItems[index]?.platform && leftItem.username === rightItems[index]?.username,
  );
}

/**
 * 뷰포트와 런타임 환경을 함께 고려해 owner handle 노출 여부를 결정한다.
 */
export function resolveShouldHideOwnerHandle({ isMobileViewport, isMobileWebRuntime }: ResolveShouldHideOwnerHandleParams) {
  return isMobileViewport || isMobileWebRuntime;
}

/**
 * 소유자 편집 화면에서 콘텐츠와 툴바가 동일한 소셜 목록 상태를 공유하도록 조율한다.
 */
export function EditablePageOwnerSection({
  handle,
  initialIsPublic,
  initialName,
  initialBio,
  initialImage,
  initialItems,
  initialSocialItems,
}: EditablePageOwnerSectionProps) {
  const [socialItems, setSocialItems] = useState<ConnectedSocialItem[]>(initialSocialItems);
  const isMobileViewport = useIsMobile();
  const isMobileWebRuntime = useIsMobileWebRuntime();
  const shouldHideHandle = resolveShouldHideOwnerHandle({
    isMobileViewport,
    isMobileWebRuntime,
  });
  const handleSocialItemsChange = useCallback((nextItems: ConnectedSocialItem[]) => {
    setSocialItems((prevItems) => (areSocialItemsEqual(prevItems, nextItems) ? prevItems : nextItems));
  }, []);

  return (
    <PageSaveStatusProvider>
      {shouldHideHandle ? null : (
        <div className="hidden min-w-0 max-w-md truncate py-6 font-semibold text-base tracking-wide md:block">{handle}</div>
      )}
      <PublicPageShell>
        <EditablePageContent
          handle={handle}
          initialName={initialName}
          initialBio={initialBio}
          initialImage={initialImage}
          initialItems={initialItems}
          initialSocialItems={socialItems}
        />
      </PublicPageShell>
      <OwnerActionFloatingToolbar
        handle={handle}
        initialIsPublic={initialIsPublic}
        initialSocialItems={socialItems}
        onSocialItemsChange={handleSocialItemsChange}
      />
      <PageSaveStatusIndicator />
    </PageSaveStatusProvider>
  );
}
