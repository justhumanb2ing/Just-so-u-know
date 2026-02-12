"use client";

import { EditablePageProfile } from "@/components/public-page/editable-page-profile";
import {
  type EditableSocialAccountInitialItem,
  EditableSocialAccountsSection,
} from "@/components/public-page/editable-social-accounts-section";
import { EditablePageItemSection } from "@/components/public-page/page-item-section";
import { PageSaveStatusIndicator } from "@/components/public-page/page-save-status-indicator";
import type { InitialPageItem } from "@/hooks/use-page-item-composer";
import { PageSaveStatusProvider } from "@/hooks/use-page-save-status";

type EditablePageContentProps = {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
  initialImage: string | null;
  initialItems: InitialPageItem[];
  initialSocialItems: EditableSocialAccountInitialItem[];
};

/**
 * 공개 페이지 편집 영역을 저장 상태 Provider로 감싸 전역 저장 인디케이터를 노출한다.
 */
export function EditablePageContent({
  handle,
  initialName,
  initialBio,
  initialImage,
  initialItems,
  initialSocialItems,
}: EditablePageContentProps) {
  return (
    <PageSaveStatusProvider>
      <div className="flex flex-col gap-8">
        <EditablePageProfile handle={handle} initialName={initialName} initialBio={initialBio} initialImage={initialImage} />
        <EditablePageItemSection handle={handle} initialItems={initialItems} />
        <EditableSocialAccountsSection initialItems={initialSocialItems} />
      </div>
      <PageSaveStatusIndicator />
    </PageSaveStatusProvider>
  );
}
