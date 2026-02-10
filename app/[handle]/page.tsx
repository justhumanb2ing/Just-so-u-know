import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { EditablePageProfile } from "@/components/public-page/editable-page-profile";
import {
  PUBLIC_PAGE_BIO_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_NAME_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { auth } from "@/lib/auth/auth";
import { findPublicPageByPathHandle } from "@/service/onboarding/public-page";

export default async function PublicPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const requestHeaders = await headers();
  const [page, session] = await Promise.all([
    findPublicPageByPathHandle(handle),
    auth.api.getSession({
      headers: requestHeaders,
    }),
  ]);

  if (!page) {
    notFound();
  }

  const isOwner = page.userId === session?.user.id;

  return (
    <main className="container mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-6">
      {isOwner ? (
        <EditablePageProfile handle={page.handle} initialName={page.name} initialBio={page.bio} />
      ) : (
        <section className={PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME}>
          <h1 className={PUBLIC_PAGE_NAME_CLASSNAME}>{page.name ?? page.handle}</h1>
          {page.bio ? <p className={PUBLIC_PAGE_BIO_CLASSNAME}>{page.bio}</p> : null}
        </section>
      )}
      {page.image ? <p className="text-muted-foreground text-sm">Image URL: {page.image}</p> : null}
    </main>
  );
}
