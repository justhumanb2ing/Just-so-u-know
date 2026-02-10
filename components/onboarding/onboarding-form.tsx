"use client";

import { motion } from "motion/react";
import { useActionState } from "react";
import type { OnboardingSubmitState } from "@/app/(auth)/onboarding/actions";
import { submitOnboardingAction } from "@/app/(auth)/onboarding/actions";
import { HandleInputField } from "@/components/onboarding/handle-input-field";
import { OnboardingComplete } from "@/components/onboarding/onboarding-complete";
import { useHandleAvailability } from "@/components/onboarding/use-handle-availability";
import { Button } from "@/components/ui/button";
import { DeleteAccountButton } from "../auth/delete-account-button";
import { SignOutButton } from "../auth/sign-out-button";
import { FieldError } from "../ui/field";

const INITIAL_ONBOARDING_SUBMIT_STATE: OnboardingSubmitState = { status: "idle" };

export function OnboardingForm() {
  const { handleInput, handleCheckState, statusMessage, verifiedHandle, onHandleChange } = useHandleAvailability();
  const [submitState, submitAction, isSubmitting] = useActionState(submitOnboardingAction, INITIAL_ONBOARDING_SUBMIT_STATE);

  const canSubmit = Boolean(verifiedHandle) && !isSubmitting;

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

        <form action={submitAction} className="space-y-4">
          <HandleInputField
            handleInput={handleInput}
            handleCheckState={handleCheckState}
            statusMessage={statusMessage}
            onHandleChange={onHandleChange}
          />

          <input type="hidden" name="verifiedHandle" value={verifiedHandle ?? ""} />
          {submitState.status === "error" ? <FieldError id="handle-error">{submitState.message}</FieldError> : null}

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.6 }}
          >
            <Button type="submit" size={"lg"} disabled={!canSubmit} className={"w-full py-6 text-base"}>
              {isSubmitting ? "Creating page..." : "Create my page!"}
            </Button>
          </motion.div>
        </form>
      </div>

      <aside className="flex items-center gap-3">
        <SignOutButton />
        <DeleteAccountButton />
      </aside>
    </div>
  );
}
