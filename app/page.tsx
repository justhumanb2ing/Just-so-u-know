import type { Metadata } from "next";
import LandingFooter from "@/components/layout/landing-footer";
import LandingHeader from "@/components/layout/landing-header";
import LandingHero from "@/components/layout/landing-hero";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return (
    <main className="flex min-h-dvh w-full flex-col px-6">
      <LandingHeader />
      <LandingHero />
      <LandingFooter />
    </main>
  );
}
