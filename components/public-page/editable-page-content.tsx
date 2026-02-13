"use client";

import { EditablePageProfile } from "@/components/public-page/editable-page-profile";
import { EditablePageItemSection } from "@/components/public-page/page-item-section";
import type { InitialPageItem } from "@/hooks/use-page-item-composer";

type EditablePageContentProps = {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
  initialImage: string | null;
  initialItems: InitialPageItem[];
};

/**
 * 공개 페이지 편집 영역을 저장 상태 Provider로 감싸 전역 저장 인디케이터를 노출한다.
 */
export function EditablePageContent({ handle, initialName, initialBio, initialImage, initialItems }: EditablePageContentProps) {
  return (
    <div className="flex flex-col gap-8">
      <EditablePageProfile handle={handle} initialName={initialName} initialBio={initialBio} initialImage={initialImage} />
      <EditablePageItemSection handle={handle} initialItems={initialItems} />
    </div>
  );
}
