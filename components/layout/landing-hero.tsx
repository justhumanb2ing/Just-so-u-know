import Link from "next/link";
import { TextLoop } from "../effect/text-loop";
import { Button } from "../ui/button";
import CTAButton from "./cta-button";

export default function LandingHero() {
  return (
    <section className="flex h-dvh flex-col items-center justify-center gap-8">
      <div className="inline-flex items-center whitespace-pre-wrap text-lg md:text-3xl">
        <p>Maybe you are... </p>
        <TextLoop
          className="w-20 overflow-y-clip py-2 font-semibold"
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
