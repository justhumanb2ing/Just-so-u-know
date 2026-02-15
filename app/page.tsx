import Link from "next/link";
import CTAButton from "@/components/layout/cta-button";
import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

export default function Page() {
  return (
    <main className="container mx-auto flex min-h-dvh w-full p-6">
      <CTAButton />
      <Button
        variant={"link"}
        size={"sm"}
        className="text-muted-foreground"
        nativeButton={false}
        render={<Link href={"/changelog"}>Changelog</Link>}
      ></Button>
    </main>
  );
}
