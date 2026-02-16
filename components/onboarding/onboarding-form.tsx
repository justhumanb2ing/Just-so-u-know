"use client";

import { motion } from "motion/react";
import { useActionState, useEffect, useRef } from "react";
import type { OnboardingSubmitState } from "@/app/(auth)/onboarding/actions";
import { submitOnboardingAction } from "@/app/(auth)/onboarding/actions";
import { HandleForm } from "@/components/onboarding/handle-form";
import { OnboardingAccountActions } from "@/components/onboarding/onboarding-account-actions";
import { OnboardingComplete } from "@/components/onboarding/onboarding-complete";
import { trackSignupComplete } from "@/service/analytics/tracker";

const INITIAL_ONBOARDING_SUBMIT_STATE: OnboardingSubmitState = { status: "idle" };

export function OnboardingForm() {
  const [submitState, submitAction, isSubmitting] = useActionState(submitOnboardingAction, INITIAL_ONBOARDING_SUBMIT_STATE);
  const trackedSignupCompleteKeyRef = useRef<string | null>(null);
  const submitErrorMessage = submitState.status === "error" ? submitState.message : undefined;

  useEffect(() => {
    if (submitState.status !== "success") {
      return;
    }

    const trackingKey = `${submitState.userId}:${submitState.createdPageId}`;

    if (trackedSignupCompleteKeyRef.current === trackingKey) {
      return;
    }

    trackSignupComplete({
      userId: submitState.userId,
      createdPageId: submitState.createdPageId,
      source: "onboarding",
    });
    trackedSignupCompleteKeyRef.current = trackingKey;
  }, [submitState]);

  if (submitState.status === "success") {
    return (
      <div className="flex h-full flex-col justify-center">
        <OnboardingComplete publicPath={submitState.publicPath} handle={submitState.storedHandle} />
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

      <OnboardingAccountActions />
    </div>
  );
}
