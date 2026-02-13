import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { findPageByPathHandle } from "@/service/onboarding/public-page";
import { reorderVisiblePageItems } from "@/service/page/items";
import { normalizeStoredHandleFromPath, pageItemReorderSchema } from "@/service/page/schema";

export const runtime = "nodejs";

type ReorderItemRouteContext = {
  params: Promise<{ handle: string }>;
};

type PostgresErrorLike = {
  code?: string;
  message?: string;
  cause?: unknown;
};

function toPostgresErrorLike(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as PostgresErrorLike;

  if (typeof candidate.code === "string" || typeof candidate.message === "string") {
    return candidate;
  }

  if (candidate.cause) {
    return toPostgresErrorLike(candidate.cause);
  }

  return candidate;
}

/**
 * 요청 헤더로 세션 조회를 시도하고, 조회 실패 예외는 비로그인 상태로 처리한다.
 */
async function resolveSessionOrNull(requestHeaders: Headers) {
  try {
    return await auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("[pages/items/reorder] Failed to get session.", error);
    return null;
  }
}

/**
 * 아이템 순서 변경 중 발생한 DB 예외를 HTTP 상태 코드/메시지로 정규화한다.
 */
function mapReorderItemError(error: unknown) {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;
  const message = postgresError?.message ?? "Failed to reorder item.";

  if (code === "P0001" || code === "23505" || code === "22003" || code === "22P02") {
    return {
      status: 422,
      message: code === "P0001" ? message : "Invalid item order.",
    };
  }

  return {
    status: 500,
    message: "Failed to reorder item.",
  };
}

/**
 * 소유한 페이지의 가시 아이템 순서를 전체 배열 기준으로 갱신한다.
 */
export async function PATCH(request: Request, context: ReorderItemRouteContext) {
  const requestHeaders = await headers();
  const session = await resolveSessionOrNull(requestHeaders);

  if (!session) {
    return Response.json(
      {
        status: "error",
        message: "You need to sign in first.",
      },
      { status: 401 },
    );
  }

  const { handle } = await context.params;
  const storedHandle = normalizeStoredHandleFromPath(handle);

  if (!storedHandle) {
    return Response.json(
      {
        status: "error",
        message: "Page not found.",
      },
      { status: 404 },
    );
  }

  const page = await findPageByPathHandle(handle);

  if (!page) {
    return Response.json(
      {
        status: "error",
        message: "Page not found.",
      },
      { status: 404 },
    );
  }

  const isOwner = page.userId === session.user.id;

  if (!isOwner) {
    return Response.json(
      {
        status: "error",
        message: "You do not have permission to update this page.",
      },
      { status: 403 },
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Invalid request payload.",
      },
      { status: 400 },
    );
  }

  const parsedBody = pageItemReorderSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return Response.json(
      {
        status: "error",
        message: parsedBody.error.issues[0]?.message ?? "Invalid request payload.",
      },
      { status: 422 },
    );
  }

  try {
    const didReorder = await reorderVisiblePageItems({
      pageId: page.id,
      itemIds: parsedBody.data.itemIds,
    });

    if (!didReorder) {
      return Response.json(
        {
          status: "error",
          message: "Invalid item order.",
        },
        { status: 422 },
      );
    }

    return Response.json({
      status: "success",
    });
  } catch (error) {
    console.error("[pages/items/reorder] Failed to reorder items.", error);
    const mappedError = mapReorderItemError(error);

    return Response.json(
      {
        status: "error",
        message: mappedError.message,
      },
      { status: mappedError.status },
    );
  }
}
