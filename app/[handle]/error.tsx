"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/test-button";
import { PRIVATE_PAGE_ACCESS_DENIED_ERROR } from "./constants";

type PublicPageErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PublicPageError({ error, reset }: PublicPageErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isPrivatePageDeniedError = error.message === PRIVATE_PAGE_ACCESS_DENIED_ERROR;

  return (
    <main className="flex h-full w-full flex-col items-center justify-center gap-8 p-6">
      <header className="space-y-4 text-center">
        <h2 className="font-bold text-2xl tracking-tighter md:text-3xl">
          {isPrivatePageDeniedError ? "This page is private" : "Something went wrong"}
        </h2>
        <p className="text-sm md:text-base">
          {isPrivatePageDeniedError ? "Only the page owner can access this page." : "Please try again in a moment."}
        </p>
      </header>
      <aside className="flex flex-col items-center gap-2">
        <Button size={"lg"} onClick={() => reset()} className="rounded-sm">
          Try again
        </Button>
        <Button variant={"link"} render={<Link href="/">Go Home</Link>} />
      </aside>
    </main>
  );
}
