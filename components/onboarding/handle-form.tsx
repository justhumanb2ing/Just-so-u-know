"use client";

import { useState } from "react";
import { HandleInputField } from "@/components/onboarding/handle-input-field";
import { type UseHandleAvailabilityResult, useHandleAvailability } from "@/components/onboarding/use-handle-availability";
import { FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/test-button";

type HandleFormMode = "create" | "update";

type HandleFormHiddenField = {
  name: string;
  value: string;
};

type HandleFormProps = {
  mode?: HandleFormMode;
  formAction: (payload: FormData) => void;
  isSubmitting: boolean;
  submitErrorMessage?: string;
  hiddenFields?: HandleFormHiddenField[];
};

type ResolveHandleSubmitErrorMessageInput = {
  submitErrorMessage?: string;
  currentHandleInput: string;
  submittedHandleAtRequest: string | null;
};

type ResolveHandleCheckErrorMessageInput = {
  handleCheckState: UseHandleAvailabilityResult["handleCheckState"];
};

const HANDLE_FORM_LABELS: Record<HandleFormMode, { idle: string; pending: string }> = {
  create: {
    idle: "Create my page!",
    pending: "Creating page...",
  },
  update: {
    idle: "Update handle",
    pending: "Updating handle...",
  },
};

/**
 * 제출 에러가 현재 입력값 기준으로 유효한지 계산한다.
 * 에러가 난 뒤 입력값이 바뀌면 버튼 영역을 다시 노출한다.
 */
export function resolveHandleSubmitErrorMessage({
  submitErrorMessage,
  currentHandleInput,
  submittedHandleAtRequest,
}: ResolveHandleSubmitErrorMessageInput) {
  if (!submitErrorMessage) {
    return null;
  }

  if (!submittedHandleAtRequest) {
    return null;
  }

  if (submittedHandleAtRequest !== currentHandleInput) {
    return null;
  }

  return submitErrorMessage;
}

/**
 * 핸들 중복/유효성 체크 단계에서 발생한 에러 메시지를 반환한다.
 */
export function resolveHandleCheckErrorMessage({ handleCheckState }: ResolveHandleCheckErrorMessageInput) {
  if (handleCheckState.status === "taken" || handleCheckState.status === "invalid" || handleCheckState.status === "error") {
    return handleCheckState.message;
  }

  return null;
}

/**
 * 핸들 검증 입력/제출 영역을 공통화한 폼 컴포넌트.
 * create/update 모드를 버튼 라벨만 다르게 사용한다.
 */
export function HandleForm({ mode = "create", formAction, isSubmitting, submitErrorMessage, hiddenFields }: HandleFormProps) {
  const { handleInput, handleCheckState, verifiedHandle, onHandleChange } = useHandleAvailability();
  const [submittedHandleAtRequest, setSubmittedHandleAtRequest] = useState<string | null>(null);

  const submitLabels = HANDLE_FORM_LABELS[mode];
  const canSubmit = Boolean(verifiedHandle) && !isSubmitting;
  const visibleSubmitErrorMessage = resolveHandleSubmitErrorMessage({
    submitErrorMessage,
    currentHandleInput: handleInput,
    submittedHandleAtRequest,
  });
  const visibleHandleCheckErrorMessage = resolveHandleCheckErrorMessage({
    handleCheckState,
  });
  const visibleActionErrorMessage = visibleHandleCheckErrorMessage ?? visibleSubmitErrorMessage;

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmitCapture={() => {
        setSubmittedHandleAtRequest(handleInput);
      }}
    >
      <HandleInputField handleInput={handleInput} handleCheckState={handleCheckState} onHandleChange={onHandleChange} />

      <input type="hidden" name="verifiedHandle" value={verifiedHandle} />
      {hiddenFields?.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}

      {visibleActionErrorMessage ? (
        <FieldError id="handle-error">{visibleActionErrorMessage}</FieldError>
      ) : (
        <Button type="submit" size="lg" disabled={!canSubmit} className="w-full py-6 font-semibold text-base!">
          {isSubmitting ? submitLabels.pending : submitLabels.idle}
        </Button>
      )}
    </form>
  );
}
