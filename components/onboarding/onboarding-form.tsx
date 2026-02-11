"use client";

import { motion } from "motion/react";
import { useActionState } from "react";
import type { OnboardingSubmitState } from "@/app/(auth)/onboarding/actions";
import { submitOnboardingAction } from "@/app/(auth)/onboarding/actions";
import { HandleForm } from "@/components/onboarding/handle-form";
import { OnboardingComplete } from "@/components/onboarding/onboarding-complete";
import { DeleteAccountButton } from "../auth/delete-account-button";
import { SignOutButton } from "../auth/sign-out-button";

const INITIAL_ONBOARDING_SUBMIT_STATE: OnboardingSubmitState = { status: "idle" };

export function OnboardingForm() {
  const [submitState, submitAction, isSubmitting] = useActionState(submitOnboardingAction, INITIAL_ONBOARDING_SUBMIT_STATE);
  const submitErrorMessage = submitState.status === "error" ? submitState.message : undefined;

  if (submitState.status === "success") {
    return (
      <div className="flex h-full flex-col justify-center">
        <OnboardingComplete publicPath={submitState.publicPath} storedHandle={submitState.storedHandle} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between">
      <div />
      <div className="flex flex-col gap-4">
        <motion.h1
          className="font-semibold text-2xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Create your unique handle
        </motion.h1>

        <HandleForm formAction={submitAction} isSubmitting={isSubmitting} submitErrorMessage={submitErrorMessage} />
      </div>

      <aside className="flex items-center gap-3">
        <SignOutButton />
        <DeleteAccountButton />
      </aside>
    </div>
  );
}
