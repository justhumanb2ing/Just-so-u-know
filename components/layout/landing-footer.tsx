import Link from "next/link";
import { SITE_NAME } from "@/config/seo/site";

export default function LandingFooter() {
  return (
    <footer className="container mx-auto py-0 pb-20 md:h-[20vh]">
      <section className="flex h-full flex-col justify-between gap-8">
        <aside className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="text-sm md:text-base">
            <div>{SITE_NAME}, A Link in Bio</div>
            <div>— more than a link.</div>
          </div>

          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-3 text-sm md:text-sm">
              <li>
                <Link href={"/sign-in"} prefetch={false} className={"p-0 font-medium hover:underline"}>
                  Sign in
                </Link>
              </li>
              <li>
                <Link href={"/changelog"} prefetch={false} className={"p-0 font-medium hover:underline"}>
                  Changelog
                </Link>
              </li>
              <li>
                <a
                  href="https://buymeacoffee.com/justhumanb2ing"
                  target="_blank"
                  className={"p-0 font-medium hover:underline"}
                  rel="noopener"
                >
                  Donate Coffee
                </a>
              </li>
            </ul>
            <div className="mt-0 text-sm md:text-sm">
              <h3 className="font-medium">Contact</h3>
              <a href="mailto:justhumanb2ing@gmail.com" className="text-muted-foreground">
                justhumanb2ing@gmail.com
              </a>
            </div>
          </div>
        </aside>
        <aside className="flex w-full flex-col items-start justify-between gap-4 text-sm md:flex-row md:items-end md:text-sm">
          <div className="">
            <p className="">Built in somewhere in seoul.</p>
            <p className="">
              <span>Designed by</span>
              <span className="underline">
                <a href="https://github.com/justhumanb2ing" target="_blank" rel="noopener">
                  Justhumanbeing
                </a>
              </span>
            </p>
          </div>
          <div className="">2026. {SITE_NAME}, All rights reserved.</div>
        </aside>
      </section>
    </footer>
  );
}
