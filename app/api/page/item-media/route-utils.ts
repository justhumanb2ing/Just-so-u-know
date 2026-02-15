import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { findOwnedPageImage, type OwnedPageImageRow } from "@/service/onboarding/public-page";
import { storedHandleSchema } from "@/service/onboarding/schema";
import { isAllowedPageItemMediaFileSize, isAllowedPageItemMediaMimeType } from "@/service/page/item-media";

type AuthorizedPageOwnerResult =
  | {
      status: "success";
      userId: string;
      storedHandle: string;
      ownedPage: OwnedPageImageRow;
    }
  | {
      status: "error";
      response: Response;
    };

const pageItemMediaInitUploadRequestSchema = z.object({
  handle: storedHandleSchema,
  mimeType: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => isAllowedPageItemMediaMimeType(value), {
      message: "Unsupported media format.",
    }),
  fileSize: z
    .number()
    .int()
    .refine((value) => isAllowedPageItemMediaFileSize(value), {
      message: "Media file is too large.",
    }),
  fileName: z.string().trim().min(1).max(255),
});

const pageItemMediaCompleteUploadRequestSchema = z.object({
  handle: storedHandleSchema,
  objectKey: z.string().trim().min(1),
  mimeType: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => isAllowedPageItemMediaMimeType(value), {
      message: "Unsupported media format.",
    }),
  fileSize: z
    .number()
    .int()
    .refine((value) => isAllowedPageItemMediaFileSize(value), {
      message: "Media file is too large.",
    }),
  fileName: z.string().trim().min(1).max(255),
});

type PageItemMediaInitUploadRequestInput = z.infer<typeof pageItemMediaInitUploadRequestSchema>;
type PageItemMediaCompleteUploadRequestInput = z.infer<typeof pageItemMediaCompleteUploadRequestSchema>;

/**
 * 페이지 미디어 업로드 API 요청의 세션/소유권을 검증하고 페이지 정보를 반환한다.
 */
export async function authorizePageItemMediaRequest(storedHandle: string): Promise<AuthorizedPageOwnerResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return {
      status: "error",
      response: Response.json(
        {
          status: "error",
          message: "You need to sign in first.",
        },
        { status: 401 },
      ),
    };
  }

  const ownedPage = await findOwnedPageImage({
    storedHandle,
    userId: session.user.id,
  });

  if (!ownedPage) {
    return {
      status: "error",
      response: Response.json(
        {
          status: "error",
          message: "You do not have permission to update this page.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    status: "success",
    userId: session.user.id,
    storedHandle,
    ownedPage,
  };
}

/**
 * 미디어 init-upload 입력을 검증한다.
 */
export function parsePageItemMediaInitUploadInput(rawBody: unknown): PageItemMediaInitUploadRequestInput {
  const parsedBody = pageItemMediaInitUploadRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    throw new Error(parsedBody.error.issues[0]?.message ?? "Invalid request payload.");
  }

  return parsedBody.data;
}

/**
 * 미디어 complete-upload 입력을 검증한다.
 */
export function parsePageItemMediaCompleteUploadInput(rawBody: unknown): PageItemMediaCompleteUploadRequestInput {
  const parsedBody = pageItemMediaCompleteUploadRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    throw new Error(parsedBody.error.issues[0]?.message ?? "Invalid request payload.");
  }

  return parsedBody.data;
}
