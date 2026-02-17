import { ChevronLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { createTemplatedPageTitle } from "@/config/seo/metadata";
import { SITE_NAME } from "@/config/seo/site";
import { changelogEntries } from "@/service/versioning/changelog";

export const metadata: Metadata = {
  title: "Changelog",
  description: `Track product updates, improvements, and fixes in ${SITE_NAME}.`,
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: createTemplatedPageTitle("Changelog"),
    description: `Track product updates, improvements, and fixes in ${SITE_NAME}.`,
    url: "/changelog",
  },
  twitter: {
    title: createTemplatedPageTitle("Changelog"),
    description: `Track product updates, improvements, and fixes in ${SITE_NAME}.`,
  },
};

export default function Page() {
  if (changelogEntries.length === 0) {
    return (
      <main className="container mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 p-6">
        <div className="flex items-center gap-4">
          <h1 className="pb-4 font-semibold text-3xl">Changelog</h1>
          <div className="h-px w-full grow bg-border"></div>
        </div>

        <section>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nothing has changed.</EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/" className="font-medium text-sm underline underline-offset-4">
                Back to Home
              </Link>
            </EmptyContent>
          </Empty>
        </section>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 p-6 pb-12">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <Link href={"/"}>
            <ChevronLeftIcon className="size-8" />
          </Link>
          <h1 className="font-bold text-2xl">Changelog</h1>
        </div>
      </header>

      <section className="space-y-6">
        {changelogEntries.map((entry) => (
          <article key={entry.version} className="space-y-2">
            <div className="flex items-end justify-between">
              <h2 className="font-medium text-base">Version {entry.version}</h2>
              <p className="text-muted-foreground text-sm">{entry.releasedAt}</p>
            </div>

            <p className="mb-8 text-muted-foreground text-sm">{entry.summary}</p>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">What this means for you</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {entry.highlights.map((highlight) => (
                  <li key={`${entry.version}-${highlight}`}>{highlight}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
