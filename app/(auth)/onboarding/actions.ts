"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { onboardingSubmissionSchema } from "@/service/onboarding/schema";
import { checkHandleAvailability, completeOnboardingWithPageCreation, OnboardingServiceError } from "@/service/onboarding/service";

export type OnboardingSubmitState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      message: string;
      publicPath: string;
      storedHandle: string;
    };

function formValueToString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

/**
 * 클라이언트에서 handle 입력 디바운싱 검증 시 호출되는 서버 액션이다.
 */
export async function checkHandleAvailabilityAction(rawHandle: string) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return {
      status: "error" as const,
      message: "You need to sign in first.",
    };
  }

  return checkHandleAvailability(rawHandle);
}

/**
 * 온보딩 폼 제출을 처리한다.
 */
export async function submitOnboardingAction(_prevState: OnboardingSubmitState, formData: FormData): Promise<OnboardingSubmitState> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return {
      status: "error",
      message: "Session is missing. Please sign in again.",
    };
  }

  const parsed = onboardingSubmissionSchema.safeParse({
    handle: formValueToString(formData.get("handle")),
    verifiedHandle: formValueToString(formData.get("verifiedHandle")),
    name: formValueToString(formData.get("name")) || formValueToString(formData.get("title")) || null,
    bio: formValueToString(formData.get("bio")) || null,
    image: formValueToString(formData.get("image")) || null,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid onboarding input.",
    };
  }

  const payload = parsed.data;

  if (payload.verifiedHandle !== payload.handle) {
    return {
      status: "error",
      message: "Please verify handle availability before submitting.",
    };
  }

  const availability = await checkHandleAvailability(payload.handle);

  if (availability.status !== "available") {
    return {
      status: "error",
      message: availability.message,
    };
  }

  try {
    const result = await completeOnboardingWithPageCreation(session.user.id, {
      handle: payload.handle,
      name: payload.name,
      bio: payload.bio,
      image: payload.image,
    });

    return {
      status: "success",
      message: "Onboarding complete. Your page is ready.",
      publicPath: result.publicPath,
      storedHandle: result.storedHandle,
    };
  } catch (error) {
    if (error instanceof OnboardingServiceError) {
      return {
        status: "error",
        message: error.message,
      };
    }

    return {
      status: "error",
      message: "Failed to complete onboarding. Please try again.",
    };
  }
}
