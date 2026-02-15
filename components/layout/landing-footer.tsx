import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="container mx-auto h-[20vh] py-6">
      <section className="flex h-full flex-col justify-between">
        <aside className="flex justify-between">
          <div>
            <div>Link in bio</div>
            <div>— more than a link.</div>
          </div>

          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-3">
              <li>
                <Link href={"/sign-in"} prefetch={false} className={"p-0 font-medium text-sm hover:underline"}>
                  Sign in
                </Link>
              </li>
              <li>
                <Link href={"/changelog"} prefetch={false} className={"p-0 font-medium text-sm hover:underline"}>
                  Changelog
                </Link>
              </li>
            </ul>
            <div className="mt-0">
              <h3 className="font-medium text-sm">Contact</h3>
              <a href="mailto:justhumanb2ing@gmail.com" className="text-muted-foreground text-sm">
                justhumanb2ing@gmail.com
              </a>
            </div>
          </div>
        </aside>
        <aside className="flex w-full items-end justify-between">
          <div>
            <p className="text-sm">Built in somewhere in seoul.</p>
            <p className="text-sm">
              <span>Designed by</span>
              <span className="underline">
                <a href="https://github.com/justhumanb2ing" target="_blank" rel="noopener">
                  Justhumanbeing
                </a>
              </span>
            </p>
          </div>
          <div className="text-sm">2026. All rights reserved.</div>
        </aside>
      </section>
    </footer>
  );
}
