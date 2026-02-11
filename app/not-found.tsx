import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex h-full w-full flex-col items-center justify-center gap-8">
      <header className="space-y-4 text-center">
        <h2 className="font-bold text-2xl tracking-tighter md:text-3xl">Gone exploring… not found</h2>
        <p className="text-sm md:text-base">Nothing so far!</p>
      </header>
      <aside className="flex flex-col items-center gap-2">
        <Button variant={"link"} render={<Link href="/">Go Home</Link>} />
      </aside>
    </main>
  );
}
