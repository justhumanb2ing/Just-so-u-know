import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EditablePageContent } from "@/components/public-page/editable-page-content";
import { ReadonlyPageItemSection } from "@/components/public-page/page-item-section";
import {
  PUBLIC_PAGE_BIO_FIELD_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME,
  PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE,
  PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_NAME_FIELD_CLASSNAME,
  PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { auth } from "@/lib/auth/auth";
import { canEditPageProfile, findPageByPathHandle, shouldDenyPrivatePageAccess } from "@/service/onboarding/public-page";
import { findVisiblePageItemsByPathHandle } from "@/service/page/items";
import { findVisiblePageSocialItemsByPathHandle } from "@/service/page/social-items";
import { PRIVATE_PAGE_ACCESS_DENIED_ERROR } from "./constants";

/**
 * 공개 페이지 렌더 중 세션 조회 실패가 발생해도 페이지 자체는 계속 렌더링되도록 null을 반환한다.
 */
async function resolveSessionOrNull(requestHeaders: Headers) {
  try {
    return await auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("[public-page] Failed to get session.", error);
    return null;
  }
}

export default async function PublicPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const requestHeaders = await headers();
  const [page, session, pageItems] = await Promise.all([
    findPageByPathHandle(handle),
    resolveSessionOrNull(requestHeaders),
    findVisiblePageItemsByPathHandle(handle),
  ]);

  if (!page) {
    notFound();
  }

  const isOwner = page.userId === session?.user.id;
  const canEdit = canEditPageProfile({ isOwner });
  const pageSocialItems = canEdit ? await findVisiblePageSocialItemsByPathHandle(handle) : [];

  if (shouldDenyPrivatePageAccess({ isPublic: page.isPublic, isOwner })) {
    throw new Error(PRIVATE_PAGE_ACCESS_DENIED_ERROR);
  }

  return (
    <main className="container mx-auto flex h-dvh min-h-0 justify-center gap-4 overflow-hidden">
      <section className="md:floating-shadow scrollbar-hide max-h-dvh max-w-lg grow overflow-y-auto px-4 py-10 md:mt-10 md:max-h-[calc(100dvh-2.5rem)] md:rounded-t-[64px] md:border-[0.5px] md:px-10">
        {canEdit ? (
          <EditablePageContent
            handle={page.handle}
            initialName={page.name}
            initialBio={page.bio}
            initialImage={page.image}
            initialItems={pageItems}
            initialSocialItems={pageSocialItems}
          />
        ) : (
          <section className={PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME}>
            {page.image ? (
              <div className={PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME}>
                <Image
                  src={page.image}
                  alt={`${page.name ?? page.handle} profile`}
                  fill
                  quality={95}
                  sizes={PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE}
                  unoptimized
                  className={PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME}
                />
              </div>
            ) : null}
            <section className={PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME}>
              <h1 className={PUBLIC_PAGE_NAME_FIELD_CLASSNAME}>{page.name ?? page.handle}</h1>
              {page.bio ? <p className={PUBLIC_PAGE_BIO_FIELD_CLASSNAME}>{page.bio}</p> : null}
            </section>
            <ReadonlyPageItemSection items={pageItems} />
          </section>
        )}
      </section>
    </main>
  );
}
