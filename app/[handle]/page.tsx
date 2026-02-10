import { notFound } from "next/navigation";
import { findPublicPageByPathHandle } from "@/service/onboarding/public-page";

export default async function PublicPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const page = await findPublicPageByPathHandle(handle);

  if (!page) {
    notFound();
  }

  return (
    <main className="container mx-auto flex min-h-dvh max-w-2xl flex-col gap-4 p-6">
      <h1 className="font-semibold text-3xl">{page.title ?? page.handle}</h1>
      {page.bio ? <p className="text-muted-foreground">{page.bio}</p> : null}
      {page.image ? <p className="text-muted-foreground text-sm">Image URL: {page.image}</p> : null}
    </main>
  );
}
