"use client";

import { useState } from "react";
import { HandleInputField } from "@/components/onboarding/handle-input-field";
import {
  normalizeHandleInput,
  type UseHandleAvailabilityResult,
  useHandleAvailability,
} from "@/components/onboarding/use-handle-availability";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";

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
  initialHandle?: string;
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
type ResolveHandleAvailabilityOptionsInput = {
  mode: HandleFormMode;
  initialHandle?: string;
};
type ResolveHandleCanSubmitInput = {
  mode: HandleFormMode;
  initialHandle?: string;
  currentHandleInput: string;
  verifiedHandle: string;
  isSubmitting: boolean;
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
 * 폼 모드에 맞춰 초기 입력값/초기 검증값을 계산한다.
 * create 모드에서는 항상 빈 입력으로 시작하고,
 * update 모드에서는 현재 handle을 즉시 제출 가능 상태로 사용한다.
 */
export function resolveHandleAvailabilityOptions({ mode, initialHandle }: ResolveHandleAvailabilityOptionsInput) {
  if (mode === "create") {
    return {
      initialHandleInput: "",
      initialVerifiedHandle: "",
    };
  }

  const normalizedInitialHandle = normalizeHandleInput(initialHandle ?? "");

  return {
    initialHandleInput: normalizedInitialHandle,
    initialVerifiedHandle: normalizedInitialHandle,
  };
}

/**
 * 제출 버튼 활성화 여부를 계산한다.
 * update 모드에서는 기존 handle과 동일한 값이면 변경사항이 없으므로 비활성화한다.
 */
export function resolveHandleCanSubmit({
  mode,
  initialHandle,
  currentHandleInput,
  verifiedHandle,
  isSubmitting,
}: ResolveHandleCanSubmitInput) {
  if (isSubmitting) {
    return false;
  }

  if (!verifiedHandle) {
    return false;
  }

  if (mode !== "update") {
    return true;
  }

  const normalizedInitialHandle = normalizeHandleInput(initialHandle ?? "");
  return normalizedInitialHandle !== currentHandleInput;
}

/**
 * 핸들 검증 입력/제출 영역을 공통화한 폼 컴포넌트.
 * create/update 모드를 버튼 라벨만 다르게 사용한다.
 */
export function HandleForm({
  mode = "create",
  formAction,
  isSubmitting,
  submitErrorMessage,
  initialHandle,
  hiddenFields,
}: HandleFormProps) {
  const availabilityOptions = resolveHandleAvailabilityOptions({ mode, initialHandle });
  const { handleInput, handleCheckState, verifiedHandle, onHandleChange } = useHandleAvailability(availabilityOptions);
  const [submittedHandleAtRequest, setSubmittedHandleAtRequest] = useState<string | null>(null);

  const submitLabels = HANDLE_FORM_LABELS[mode];
  const canSubmit = resolveHandleCanSubmit({
    mode,
    initialHandle,
    currentHandleInput: handleInput,
    verifiedHandle,
    isSubmitting,
  });
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
        <Button type="submit" size="lg" disabled={!canSubmit} className="w-full rounded-full py-6 text-base">
          {isSubmitting ? submitLabels.pending : submitLabels.idle}
        </Button>
      )}
    </form>
  );
}
