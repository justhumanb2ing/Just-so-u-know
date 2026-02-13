"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { type ConnectedSocialItem, ConnectedSocialItems } from "@/components/public-page/connected-social-items";
import { EditablePageProfile } from "@/components/public-page/editable-page-profile";
import { EditablePageItemSection } from "@/components/public-page/page-item-section";
import { buildEditableSectionMotionConfig, resolveEditableSectionRevealDurationMs } from "@/components/public-page/page-motion";
import type { InitialPageItem } from "@/hooks/use-page-item-composer";

type EditablePageContentProps = {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
  initialImage: string | null;
  initialItems: InitialPageItem[];
  initialSocialItems: ConnectedSocialItem[];
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
  const shouldReduceMotion = useReducedMotion() ?? false;
  const sectionMotionConfig = useMemo(() => buildEditableSectionMotionConfig(shouldReduceMotion), [shouldReduceMotion]);
  const composerAppearDelayMs = useMemo(() => resolveEditableSectionRevealDurationMs(sectionMotionConfig), [sectionMotionConfig]);

  return (
    <div className="flex flex-col gap-10">
      <motion.div
        initial={sectionMotionConfig.profile.initial}
        animate={sectionMotionConfig.profile.animate}
        transition={sectionMotionConfig.profile.transition}
      >
        <EditablePageProfile handle={handle} initialName={initialName} initialBio={initialBio} initialImage={initialImage} />
      </motion.div>
      <motion.div
        initial={sectionMotionConfig.social.initial}
        animate={sectionMotionConfig.social.animate}
        transition={sectionMotionConfig.social.transition}
      >
        <ConnectedSocialItems items={initialSocialItems} />
      </motion.div>
      <motion.div
        initial={sectionMotionConfig.items.initial}
        animate={sectionMotionConfig.items.animate}
        transition={sectionMotionConfig.items.transition}
      >
        <EditablePageItemSection handle={handle} initialItems={initialItems} composerAppearDelayMs={composerAppearDelayMs} />
      </motion.div>
    </div>
  );
}
