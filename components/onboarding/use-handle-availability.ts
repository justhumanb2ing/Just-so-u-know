"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkHandleAvailabilityAction } from "@/app/(auth)/onboarding/actions";
import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH } from "@/service/onboarding/schema";
import type { HandleAvailabilityResult } from "@/service/onboarding/service";

const HANDLE_SANITIZE_PATTERN = /[^a-z0-9]/g;
const HANDLE_CHECK_DEBOUNCE_MS = 400;

type HandleCheckState = { status: "idle" } | HandleAvailabilityResult | { status: "checking"; message: string };

export type UseHandleAvailabilityResult = {
  handleInput: string;
  handleCheckState: HandleCheckState;
  statusMessage: string;
  verifiedHandle: string;
  onHandleChange: (value: string) => void;
};

/**
 * handle 입력값 정규화와 디바운스 중복 검증 상태를 캡슐화한다.
 */
export function useHandleAvailability(): UseHandleAvailabilityResult {
  const [handleInput, setHandleInput] = useState("");
  const [handleCheckState, setHandleCheckState] = useState<HandleCheckState>({ status: "idle" });
  const lastCheckRequestIdRef = useRef(0);

  const onHandleChange = useCallback((value: string) => {
    const normalizedValue = value.toLowerCase().replace(HANDLE_SANITIZE_PATTERN, "").slice(0, HANDLE_MAX_LENGTH);
    setHandleInput(normalizedValue);
  }, []);

  useEffect(() => {
    const requestId = lastCheckRequestIdRef.current + 1;
    lastCheckRequestIdRef.current = requestId;

    if (handleInput.length === 0) {
      setHandleCheckState({ status: "idle" });
      return;
    }

    if (handleInput.length < HANDLE_MIN_LENGTH) {
      setHandleCheckState({
        status: "invalid",
        message: `Handle must be at least ${HANDLE_MIN_LENGTH} characters.`,
      });
      return;
    }

    setHandleCheckState({ status: "checking", message: "Checking handle availability..." });

    const timer = window.setTimeout(async () => {
      const result = await checkHandleAvailabilityAction(handleInput);

      if (lastCheckRequestIdRef.current !== requestId) {
        return;
      }

      setHandleCheckState(result);
    }, HANDLE_CHECK_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [handleInput]);

  const verifiedHandle = handleCheckState.status === "available" ? (handleCheckState.normalizedHandle ?? "") : "";
  const statusMessage =
    handleCheckState.status === "idle"
      ? "lowercase letters and numbers only (3 to 20 characters)."
      : handleCheckState.message;

  return {
    handleInput,
    handleCheckState,
    statusMessage,
    verifiedHandle,
    onHandleChange,
  };
}
