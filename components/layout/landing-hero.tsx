import Link from "next/link";
import { AuroraText } from "../effect/aurora-text";
import { TextLoop } from "../effect/text-loop";
import { Button } from "../ui/button";
import CTAButton from "./cta-button";

export default function LandingHero() {
  return (
    <section className="flex h-dvh flex-col items-center justify-center gap-8">
      <header className="flex flex-col items-center gap-2">
        <AuroraText className="font-bold text-3xl md:text-3xl" colors={["#000", "#8f8f8f", "#333"]}>
          A Link in Bio.
        </AuroraText>
        <p className="font-medium text-primary/80">All things me, just in one place.</p>
      </header>
      <div className="flex flex-col items-center gap-3 whitespace-pre-wrap text-lg md:text-lg">
        <div className="inline-flex items-center whitespace-pre-wrap">
          <p>Maybe you are a... </p>
          <TextLoop
            className="w-32 overflow-y-clip rounded-lg bg-muted px-2 py-2 text-center font-semibold"
            interval={3}
            transition={{
              type: "spring",
              stiffness: 900,
              damping: 80,
              mass: 10,
            }}
            variants={{
              initial: {
                y: 20,
                rotateX: 90,
                opacity: 0,
                filter: "blur(4px)",
              },
              animate: {
                y: 0,
                rotateX: 0,
                opacity: 1,
                filter: "blur(0px)",
              },
              exit: {
                y: -20,
                rotateX: -90,
                opacity: 0,
                filter: "blur(4px)",
              },
            }}
          >
            <span>Creator</span>
            <span>Streamer</span>
            <span>Designer</span>
            <span>Writer</span>
            <span>Developer</span>
          </TextLoop>
        </div>
        <div className="text-base">
          <p>but maybe.. can be all!</p>
        </div>
      </div>
      <aside className="flex flex-col gap-2">
        <CTAButton />
        <Button
          variant={"link"}
          size={"sm"}
          nativeButton={false}
          className={"text-muted-foreground text-sm"}
          render={<Link href={"/sign-in"}>Sign in</Link>}
        ></Button>
      </aside>
    </section>
  );
}
