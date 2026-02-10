import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { findOwnedPageImage, type OwnedPageImageRow } from "@/service/onboarding/public-page";
import { pageImageHandleSchema } from "@/service/onboarding/schema";

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

/**
 * 이미지 API 요청의 세션/입력/소유권을 검증하고 페이지 정보를 반환한다.
 */
export async function authorizePageImageRequest(request: Request): Promise<AuthorizedPageOwnerResult> {
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

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return {
      status: "error",
      response: Response.json(
        {
          status: "error",
          message: "Invalid request payload.",
        },
        { status: 400 },
      ),
    };
  }

  const parsedBody = pageImageHandleSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return {
      status: "error",
      response: Response.json(
        {
          status: "error",
          message: parsedBody.error.issues[0]?.message ?? "Invalid request payload.",
        },
        { status: 400 },
      ),
    };
  }

  const ownedPage = await findOwnedPageImage({
    storedHandle: parsedBody.data.handle,
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
    storedHandle: parsedBody.data.handle,
    ownedPage,
  };
}
