import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EditablePageOwnerSection } from "@/components/public-page/editable-page-owner-section";
import { ReadonlyPageVisitorSection } from "@/components/public-page/readonly-page-visitor-section";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { auth } from "@/lib/auth/auth";
import { isMobileWebUserAgent } from "@/lib/mobile-web-runtime";
import { canEditPageProfile, findPageByPathHandle, shouldDenyPrivatePageAccess } from "@/service/onboarding/public-page";
import { findVisiblePageItemsByPathHandle } from "@/service/page/items";
import { findVisiblePageSocialItemsByPathHandle } from "@/service/page/social-items";
import { createPublicProfileJsonLd } from "@/service/seo/json-ld";
import { createPrivateProfileMetadata, createProfileNotFoundMetadata, createPublicProfileMetadata } from "@/service/seo/metadata";
import { PRIVATE_PAGE_ACCESS_DENIED_ERROR } from "./constants";

type PublicPageParams = {
  handle: string;
};

type PublicPageProps = {
  params: Promise<PublicPageParams>;
};

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

/**
 * 공개 페이지 라우트 메타데이터를 접근 정책(공개/비공개/미존재)에 맞춰 생성한다.
 */
export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { handle } = await params;
  const page = await findPageByPathHandle(handle);

  if (!page) {
    return createProfileNotFoundMetadata();
  }

  if (!page.isPublic) {
    return createPrivateProfileMetadata({
      handle: page.handle,
      name: page.name,
    });
  }

  return createPublicProfileMetadata({
    handle: page.handle,
    name: page.name,
    bio: page.bio,
    image: page.image,
  });
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { handle } = await params;
  const requestHeaders = await headers();
  const [page, session, pageItems, pageSocialItems] = await Promise.all([
    findPageByPathHandle(handle),
    resolveSessionOrNull(requestHeaders),
    findVisiblePageItemsByPathHandle(handle),
    findVisiblePageSocialItemsByPathHandle(handle),
  ]);

  if (!page) {
    notFound();
  }

  const isOwner = page.userId === session?.user.id;
  const canEdit = canEditPageProfile({ isOwner });
  const shouldHideReadonlyHandle = isMobileWebUserAgent(requestHeaders.get("user-agent") ?? "");

  if (shouldDenyPrivatePageAccess({ isPublic: page.isPublic, isOwner })) {
    throw new Error(PRIVATE_PAGE_ACCESS_DENIED_ERROR);
  }

  const publicProfileJsonLd = page.isPublic
    ? createPublicProfileJsonLd({
        handle: page.handle,
        name: page.name,
        bio: page.bio,
        image: page.image,
        socialItems: pageSocialItems,
      })
    : null;

  return (
    <main className="container mx-auto flex h-dvh min-h-0 flex-col items-center justify-center gap-0 overflow-hidden">
      {publicProfileJsonLd ? <JsonLdScript id="profile-json-ld" data={publicProfileJsonLd} /> : null}
      {canEdit ? (
        <EditablePageOwnerSection
          handle={page.handle}
          initialIsPublic={page.isPublic}
          initialName={page.name}
          initialBio={page.bio}
          initialImage={page.image}
          initialItems={pageItems}
          initialSocialItems={pageSocialItems}
        />
      ) : (
        <ReadonlyPageVisitorSection
          page={page}
          socialItems={pageSocialItems}
          items={pageItems}
          hasSession={Boolean(session)}
          userImage={session?.user.image ?? null}
          userName={session?.user.name ?? null}
          shouldHideHandle={shouldHideReadonlyHandle}
        />
      )}
    </main>
  );
}
