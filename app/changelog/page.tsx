import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function Page() {
  return (
    <main className="container mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 p-6">
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
            <Button variant={"link"} size={"sm"}>
              Home
            </Button>
          </EmptyContent>
        </Empty>
      </section>
    </main>
  );
}
