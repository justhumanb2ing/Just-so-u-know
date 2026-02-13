"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkHandleAvailabilityAction } from "@/app/(auth)/onboarding/actions";
import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH } from "@/service/onboarding/schema";
import type { HandleAvailabilityResult } from "@/service/onboarding/service";

const HANDLE_SANITIZE_PATTERN = /[^a-z0-9]/g;
const HANDLE_CHECK_DEBOUNCE_MS = 400;

type HandleCheckState = { status: "idle" } | HandleAvailabilityResult | { status: "checking"; message: string };
type UseHandleAvailabilityOptions = {
  initialHandleInput?: string;
  initialVerifiedHandle?: string;
};

export type UseHandleAvailabilityResult = {
  handleInput: string;
  handleCheckState: HandleCheckState;
  verifiedHandle: string;
  onHandleChange: (value: string) => void;
};

/**
 * handle 입력값을 정책에 맞는 소문자/영문숫자 형태로 정규화한다.
 */
export function normalizeHandleInput(value: string) {
  return value.toLowerCase().replace(HANDLE_SANITIZE_PATTERN, "").slice(0, HANDLE_MAX_LENGTH);
}

/**
 * handle 입력값 정규화와 디바운스 중복 검증 상태를 캡슐화한다.
 * update 모드에서는 현재 handle을 초기 검증 완료 상태로 주입할 수 있다.
 */
export function useHandleAvailability({
  initialHandleInput = "",
  initialVerifiedHandle = "",
}: UseHandleAvailabilityOptions = {}): UseHandleAvailabilityResult {
  const normalizedInitialHandleInput = normalizeHandleInput(initialHandleInput);
  const normalizedInitialVerifiedHandle = normalizeHandleInput(initialVerifiedHandle);
  const [handleInput, setHandleInput] = useState(normalizedInitialHandleInput);
  const [handleCheckState, setHandleCheckState] = useState<HandleCheckState>(() => {
    if (normalizedInitialHandleInput.length > 0 && normalizedInitialHandleInput === normalizedInitialVerifiedHandle) {
      return {
        status: "available",
        message: "This handle is available.",
        normalizedHandle: normalizedInitialHandleInput,
      };
    }

    return { status: "idle" };
  });
  const lastCheckRequestIdRef = useRef(0);

  const onHandleChange = useCallback((value: string) => {
    const normalizedValue = normalizeHandleInput(value);
    setHandleInput(normalizedValue);
  }, []);

  useEffect(() => {
    const requestId = lastCheckRequestIdRef.current + 1;
    lastCheckRequestIdRef.current = requestId;

    /**
     * 현재 페이지의 기존 handle은 서버 중복 체크와 무관하게 즉시 제출 가능해야 한다.
     */
    if (normalizedInitialVerifiedHandle.length > 0 && handleInput === normalizedInitialVerifiedHandle) {
      setHandleCheckState({
        status: "available",
        message: "This handle is available.",
        normalizedHandle: normalizedInitialVerifiedHandle,
      });
      return;
    }

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
  }, [handleInput, normalizedInitialVerifiedHandle]);

  const verifiedHandle = handleCheckState.status === "available" ? (handleCheckState.normalizedHandle ?? "") : "";

  return {
    handleInput,
    handleCheckState,
    verifiedHandle,
    onHandleChange,
  };
}
