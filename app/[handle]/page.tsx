import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EditablePageProfile } from "@/components/public-page/editable-page-profile";
import { EditablePageItemSection, ReadonlyPageItemSection } from "@/components/public-page/page-item-section";
import {
  PUBLIC_PAGE_BIO_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME,
  PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_NAME_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { auth } from "@/lib/auth/auth";
import { canEditPageProfile, findPageByPathHandle, shouldDenyPrivatePageAccess } from "@/service/onboarding/public-page";
import { findVisiblePageItemsByPathHandle } from "@/service/page/items";
import { PRIVATE_PAGE_ACCESS_DENIED_ERROR } from "./constants";

export default async function PublicPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const requestHeaders = await headers();
  const [page, session, pageItems] = await Promise.all([
    findPageByPathHandle(handle),
    auth.api.getSession({
      headers: requestHeaders,
    }),
    findVisiblePageItemsByPathHandle(handle),
  ]);

  if (!page) {
    notFound();
  }

  const isOwner = page.userId === session?.user.id;
  const canEdit = canEditPageProfile({ isOwner });

  if (shouldDenyPrivatePageAccess({ isPublic: page.isPublic, isOwner })) {
    throw new Error(PRIVATE_PAGE_ACCESS_DENIED_ERROR);
  }

  return (
    <main className="container mx-auto flex min-h-dvh justify-center gap-4 overflow-hidden">
      <section className="sm:floating-shadow min-h-full max-w-lg grow px-8 py-10 sm:mt-10 sm:rounded-t-[64px] sm:border-[0.5px] sm:px-10">
        {canEdit ? (
          <div className="flex flex-col gap-8">
            <EditablePageProfile handle={page.handle} initialName={page.name} initialBio={page.bio} initialImage={page.image} />
            <EditablePageItemSection handle={page.handle} initialItems={pageItems} />
          </div>
        ) : (
          <section className={PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME}>
            {page.image ? (
              <div className={PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME}>
                <Image
                  src={page.image}
                  alt={`${page.name ?? page.handle} profile`}
                  width={80}
                  height={80}
                  quality={95}
                  sizes="80px"
                  unoptimized
                  className={PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME}
                />
              </div>
            ) : null}
            <h1 className={PUBLIC_PAGE_NAME_CLASSNAME}>{page.name ?? page.handle}</h1>
            {page.bio ? <p className={PUBLIC_PAGE_BIO_CLASSNAME}>{page.bio}</p> : null}
            <ReadonlyPageItemSection items={pageItems} />
          </section>
        )}
      </section>
    </main>
  );
}
