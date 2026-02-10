"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { updateOwnedPublicPageProfile } from "@/service/onboarding/public-page";
import { pageProfileUpdateSchema } from "@/service/onboarding/schema";

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

function toStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

/**
 * 공개 페이지 소유자 요청만 허용해 name/bio를 저장한다.
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
    const updatedPage = await updateOwnedPublicPageProfile({
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
