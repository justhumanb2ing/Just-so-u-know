"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { toggleOwnedPageVisibility, updateOwnedPageHandle, updateOwnedPageProfile } from "@/service/onboarding/public-page";
import { pageHandleChangeSchema, pageProfileUpdateSchema, storedHandleSchema, toStoredHandle } from "@/service/onboarding/schema";
import { checkHandleAvailability } from "@/service/onboarding/service";

export type SavePageProfileActionInput = {
  handle: string;
  name: string;
  bio: string;
};

export type SavePageProfileActionResult =
  | {
      status: "success";
      name: string | null;
      bio: string | null;
      savedAt: string;
    }
  | {
      status: "error";
      message: string;
    };

export type ChangePageHandleActionState =
  | {
      status: "idle";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "success";
      publicPath: string;
      storedHandle: string;
    };

export type TogglePageVisibilityActionInput = {
  handle: string;
};

export type TogglePageVisibilityActionResult =
  | {
      status: "success";
      isPublic: boolean;
      savedAt: string;
    }
  | {
      status: "error";
      message: string;
    };

type PostgresErrorLike = {
  code?: string;
  message?: string;
};

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toPostgresErrorLike(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as PostgresErrorLike;
}

/**
 * 핸들 변경 DB 에러를 사용자 메시지로 정규화한다.
 */
function resolveHandleChangeErrorMessage(error: unknown) {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;

  if (code === "23505") {
    return "This handle is already taken.";
  }

  if (code === "23514" || code === "22P02" || code === "P0001") {
    return postgresError?.message ?? "Invalid handle.";
  }

  return "Failed to update page handle.";
}

/**
 * 페이지 소유자 요청만 허용해 name/bio를 저장한다.
 */
export async function savePageProfileAction(rawInput: SavePageProfileActionInput): Promise<SavePageProfileActionResult> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return {
      status: "error",
      message: "You need to sign in first.",
    };
  }

  const parsedInput = pageProfileUpdateSchema.safeParse({
    storedHandle: toStringValue(rawInput.handle),
    name: toStringValue(rawInput.name),
    bio: toStringValue(rawInput.bio),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues[0]?.message ?? "Invalid page profile input.",
    };
  }

  try {
    const updatedPage = await updateOwnedPageProfile({
      storedHandle: parsedInput.data.storedHandle,
      userId: session.user.id,
      name: parsedInput.data.name,
      bio: parsedInput.data.bio,
    });

    if (!updatedPage) {
      return {
        status: "error",
        message: "You do not have permission to update this page.",
      };
    }

    return {
      status: "success",
      name: updatedPage.name,
      bio: updatedPage.bio,
      savedAt: updatedPage.updatedAt,
    };
  } catch {
    return {
      status: "error",
      message: "Failed to save page profile.",
    };
  }
}

/**
 * 페이지 소유자 요청만 허용해 handle을 변경한다.
 */
export async function changePageHandleAction(
  _prevState: ChangePageHandleActionState,
  formData: FormData,
): Promise<ChangePageHandleActionState> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return {
      status: "error",
      message: "You need to sign in first.",
    };
  }

  const parsedInput = pageHandleChangeSchema.safeParse({
    storedHandle: toStringValue(formData.get("storedHandle")),
    handle: toStringValue(formData.get("handle")),
    verifiedHandle: toStringValue(formData.get("verifiedHandle")),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues[0]?.message ?? "Invalid page handle input.",
    };
  }

  const payload = parsedInput.data;

  if (payload.verifiedHandle !== payload.handle) {
    return {
      status: "error",
      message: "Please verify handle availability before submitting.",
    };
  }

  const nextStoredHandle = toStoredHandle(payload.handle);

  if (nextStoredHandle === payload.storedHandle) {
    return {
      status: "success",
      publicPath: `/${payload.storedHandle}`,
      storedHandle: payload.storedHandle,
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
    const updatedPage = await updateOwnedPageHandle({
      storedHandle: payload.storedHandle,
      nextStoredHandle,
      userId: session.user.id,
    });

    if (!updatedPage) {
      return {
        status: "error",
        message: "You do not have permission to update this page.",
      };
    }

    return {
      status: "success",
      publicPath: `/${updatedPage.handle}`,
      storedHandle: updatedPage.handle,
    };
  } catch (error) {
    return {
      status: "error",
      message: resolveHandleChangeErrorMessage(error),
    };
  }
}

/**
 * 페이지 소유자 요청만 허용해 공개 여부(is_public)를 토글한다.
 */
export async function togglePageVisibilityAction(rawInput: TogglePageVisibilityActionInput): Promise<TogglePageVisibilityActionResult> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return {
      status: "error",
      message: "You need to sign in first.",
    };
  }

  const parsedHandle = storedHandleSchema.safeParse(toStringValue(rawInput.handle));
  if (!parsedHandle.success) {
    return {
      status: "error",
      message: parsedHandle.error.issues[0]?.message ?? "Invalid page handle input.",
    };
  }

  try {
    const updatedPage = await toggleOwnedPageVisibility({
      storedHandle: parsedHandle.data,
      userId: session.user.id,
    });

    if (!updatedPage) {
      return {
        status: "error",
        message: "You do not have permission to update this page.",
      };
    }

    return {
      status: "success",
      isPublic: updatedPage.isPublic,
      savedAt: updatedPage.updatedAt,
    };
  } catch {
    return {
      status: "error",
      message: "Failed to update page visibility.",
    };
  }
}
