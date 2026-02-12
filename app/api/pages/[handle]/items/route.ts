import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { findPageByPathHandle, shouldDenyPrivatePageAccess } from "@/service/onboarding/public-page";
import { createOwnedMemoItem, findVisiblePageItemsByStoredHandle } from "@/service/page/items";
import { normalizeStoredHandleFromPath, pageItemCreateSchema } from "@/service/page/schema";

export const runtime = "nodejs";

type CreateItemRouteContext = {
  params: Promise<{ handle: string }>;
};

type PostgresErrorLike = {
  code?: string;
  message?: string;
};

function toPostgresErrorLike(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as PostgresErrorLike;
}

/**
 * 공개/소유자 권한에 맞는 페이지 아이템 조회를 처리한다.
 */
export async function GET(_request: Request, context: CreateItemRouteContext) {
  const { handle } = await context.params;
  const requestHeaders = await headers();
  const [page, session] = await Promise.all([
    findPageByPathHandle(handle),
    auth.api.getSession({
      headers: requestHeaders,
    }),
  ]);

  if (!page) {
    return Response.json(
      {
        status: "error",
        message: "Page not found.",
      },
      { status: 404 },
    );
  }

  const isOwner = page.userId === session?.user.id;

  if (shouldDenyPrivatePageAccess({ isPublic: page.isPublic, isOwner })) {
    return Response.json(
      {
        status: "error",
        message: "You do not have permission to view this page.",
      },
      { status: 403 },
    );
  }

  const items = await findVisiblePageItemsByStoredHandle(page.handle);

  return Response.json({
    status: "success",
    items,
  });
}

/**
 * memo 아이템 생성 중 발생한 DB 예외를 HTTP 상태 코드/메시지로 정규화한다.
 */
function mapCreateItemError(error: unknown) {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;
  const message = postgresError?.message ?? "Failed to create item.";

  if (code === "P0001") {
    if (message === "page not found or permission denied") {
      return {
        status: 403,
        message: "You do not have permission to update this page.",
      };
    }

    return {
      status: 422,
      message,
    };
  }

  return {
    status: 500,
    message: "Failed to create item.",
  };
}

/**
 * 소유한 페이지에 새 아이템을 생성한다.
 * 현재는 memo 타입 생성만 지원한다.
 */
export async function POST(request: Request, context: CreateItemRouteContext) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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

  const parsedBody = pageItemCreateSchema.safeParse(rawBody);

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
    const createdItem = await createOwnedMemoItem({
      storedHandle,
      userId: session.user.id,
      content: parsedBody.data.data.content,
    });

    return Response.json(
      {
        status: "success",
        item: createdItem,
      },
      {
        status: 201,
        headers: {
          Location: `/api/pages/${encodeURIComponent(storedHandle)}/items/${createdItem.id}`,
        },
      },
    );
  } catch (error) {
    const mappedError = mapCreateItemError(error);

    return Response.json(
      {
        status: "error",
        message: mappedError.message,
      },
      { status: mappedError.status },
    );
  }
}
