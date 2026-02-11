import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/test-button";

type OnboardingCompleteProps = {
  publicPath: string;
  storedHandle: string;
};

export function OnboardingComplete({ publicPath, storedHandle }: OnboardingCompleteProps) {
  return (
    <motion.div
      className="space-y-12"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.4 } },
      }}
    >
      <div className="flex flex-col gap-1">
        <motion.h1
          className="flex min-w-0 flex-col gap-1 font-semibold text-2xl"
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <span>All done!</span>
        </motion.h1>
        <motion.h2
          className="font-medium text-base"
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Your page has been created successfully.
        </motion.h2>
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
        transition={{ duration: 1, ease: "easeOut", delay: 1 }}
      >
        {/* TODO: Update navigation link. */}
        <Button
          size={"lg"}
          variant={"default"}
          className={"w-full rounded-xl py-6 text-lg"}
          render={<Link href={publicPath}>Go to {storedHandle}</Link>}
        ></Button>
      </motion.div>
    </motion.div>
  );
}
