import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditablePageOwnerSection } from "@/components/public-page/editable-page-owner-section";
import { ReadonlyPageVisitorSection } from "@/components/public-page/readonly-page-visitor-section";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import { isMobileWebUserAgent } from "@/lib/mobile-web-runtime";
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
  const signInReturnPath = `/${page.handle}`;
  const signInHref = `/sign-in?returnTo=${encodeURIComponent(signInReturnPath)}`;
  const shouldRenderFloatingSignIn = !session && !shouldHideReadonlyHandle;

  if (shouldDenyPrivatePageAccess({ isPublic: page.isPublic, isOwner })) {
    throw new Error(PRIVATE_PAGE_ACCESS_DENIED_ERROR);
  }

  return (
    <main className="container mx-auto flex h-dvh min-h-0 flex-col items-center justify-center gap-0 overflow-hidden">
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
          shouldHideHandle={shouldHideReadonlyHandle}
        />
      )}
      {shouldRenderFloatingSignIn ? (
        <aside className="fixed bottom-3 left-3 z-40 hidden supports-[padding:max(0px)]:bottom-[max(1rem,env(safe-area-inset-bottom))] md:block">
          <Button
            variant="ghost"
            size="lg"
            nativeButton={false}
            render={
              <Link href={signInHref} prefetch={false}>
                Sign in
              </Link>
            }
          />
        </aside>
      ) : null}
    </main>
  );
}
