import CTAButton from "@/components/layout/cta-button";
import LandingFooter from "@/components/layout/landing-footer";
import LandingHeader from "@/components/layout/landing-header";

export const dynamic = "force-static";

export default function Page() {
  return (
    <main className="flex min-h-dvh w-full flex-col px-6">
      <LandingHeader />
      <section className="flex h-dvh flex-col items-center justify-center">
        <aside>
          <CTAButton />
        </aside>
      </section>
      <LandingFooter />
    </main>
  );
}
