"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useMemo } from "react";
import { PublicPageAuthAction } from "@/components/auth/public-page-auth-action";
import { ConnectedSocialItems } from "@/components/public-page/connected-social-items";
import { buildEditableSectionMotionConfig, type EditableSectionMotionConfig } from "@/components/public-page/page-motion";
import {
  PUBLIC_PAGE_BIO_FIELD_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME,
  PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE,
  PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_NAME_FIELD_CLASSNAME,
  PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { PublicPageShell } from "@/components/public-page/public-page-shell";
import { ReadonlyPageItemSection } from "@/components/public-page/readonly-page-item-section";
import { cn } from "@/lib/utils";
import type { PublicPageRow } from "@/service/onboarding/public-page";
import type { VisiblePageItem } from "@/service/page/items";
import type { VisiblePageSocialItem } from "@/service/page/social-items";
import CopyUrlButton from "../layout/copy-button";

export const READONLY_VISITOR_HANDLE_CLASSNAME = "hidden min-w-0 max-w-md truncate py-6 font-semibold text-base tracking-wide md:block";

type ReadonlyPageVisitorSectionProps = {
  page: Pick<PublicPageRow, "id" | "handle" | "name" | "bio" | "image">;
  socialItems: VisiblePageSocialItem[];
  items: VisiblePageItem[];
  hasSession: boolean;
  userImage: string | null;
  userName: string | null;
  shouldHideHandle: boolean;
};

type ResolveShouldRenderReadonlyHandleParams = {
  shouldHideHandle: boolean;
};

/**
 * 방문자 화면의 상단 handle 노출 여부를 결정한다.
 */
export function resolveShouldRenderReadonlyHandle({ shouldHideHandle }: ResolveShouldRenderReadonlyHandleParams) {
  return !shouldHideHandle;
}

/**
 * 방문자 섹션도 소유자 편집 섹션과 동일한 진입 모션 구성을 재사용한다.
 */
export function resolveReadonlySectionMotionConfig(shouldReduceMotion: boolean): EditableSectionMotionConfig {
  return buildEditableSectionMotionConfig(shouldReduceMotion);
}

/**
 * 방문자 읽기 모드에서 프로필/소셜/아이템을 동일한 섹션 모션과 함께 렌더링한다.
 */
export function ReadonlyPageVisitorSection({
  page,
  socialItems,
  items,
  hasSession,
  userImage,
  userName,
  shouldHideHandle,
}: ReadonlyPageVisitorSectionProps) {
  const shouldRenderHandle = resolveShouldRenderReadonlyHandle({ shouldHideHandle });
  const shouldReduceMotion = useReducedMotion() ?? false;
  const sectionMotionConfig = useMemo(() => resolveReadonlySectionMotionConfig(shouldReduceMotion), [shouldReduceMotion]);
  const visitorReturnTo = `/${page.handle}`;

  return (
    <>
      {shouldRenderHandle ? <div className={READONLY_VISITOR_HANDLE_CLASSNAME}>{page.handle}</div> : null}
      <PublicPageShell>
        <section className={cn(PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME, "relative")}>
          <motion.div
            initial={sectionMotionConfig.profile.initial}
            animate={sectionMotionConfig.profile.animate}
            transition={sectionMotionConfig.profile.transition}
          >
            {page.image ? (
              <div className={PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME}>
                <Image
                  src={page.image}
                  alt={`${page.name ?? page.handle} profile`}
                  fill
                  quality={75}
                  unoptimized
                  loading="eager"
                  sizes={PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE}
                  className={PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME}
                />
              </div>
            ) : null}
            <section className={PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME}>
              <h1 className={PUBLIC_PAGE_NAME_FIELD_CLASSNAME}>{page.name ?? page.handle}</h1>
              {page.bio ? <p className={PUBLIC_PAGE_BIO_FIELD_CLASSNAME}>{page.bio}</p> : null}
            </section>
          </motion.div>
          <motion.div
            initial={sectionMotionConfig.social.initial}
            animate={sectionMotionConfig.social.animate}
            transition={sectionMotionConfig.social.transition}
          >
            <ConnectedSocialItems items={socialItems} className="px-0" />
          </motion.div>
          <motion.div
            initial={sectionMotionConfig.items.initial}
            animate={sectionMotionConfig.items.animate}
            transition={sectionMotionConfig.items.transition}
          >
            <ReadonlyPageItemSection items={items} />
          </motion.div>
          <aside className="absolute top-10 right-4 md:top-18">
            <CopyUrlButton />
          </aside>
          <aside className="mt-6 md:hidden">
            <PublicPageAuthAction
              pageId={page.id}
              hasSession={hasSession}
              isOwnerPage={false}
              userImage={userImage}
              userName={userName}
              size="lg"
              placement="inline"
              returnTo={visitorReturnTo}
            />
          </aside>
        </section>
        <aside className="fixed bottom-3 left-3 z-40 hidden supports-[padding:max(0px)]:bottom-[max(1rem,env(safe-area-inset-bottom))] md:block">
          <PublicPageAuthAction
            pageId={page.id}
            hasSession={hasSession}
            isOwnerPage={false}
            userImage={userImage}
            userName={userName}
            size="lg"
            placement="floating"
            returnTo={visitorReturnTo}
          />
        </aside>
      </PublicPageShell>
    </>
  );
}
