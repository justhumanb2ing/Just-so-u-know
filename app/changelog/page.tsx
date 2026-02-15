import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

export default function Page() {
  return (
    <main className="container mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 p-6">
      <h1 className="border-b pb-4 font-semibold text-2xl">Changelog</h1>
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
