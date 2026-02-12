import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { findPageByPathHandle } from "@/service/onboarding/public-page";
import { deleteOwnedPageItem, updateOwnedMemoItem, updateOwnedPageItemSize } from "@/service/page/items";
import { normalizeStoredHandleFromPath, pageItemUpdateSchema } from "@/service/page/schema";

export const runtime = "nodejs";

type UpdateItemRouteContext = {
  params: Promise<{ handle: string; itemId: string }>;
};

type PostgresErrorLike = {
  code?: string;
  message?: string;
};

const itemIdSchema = z.uuid({
  message: "Invalid item id.",
});

/**
 * 요청 헤더로 세션 조회를 시도하고, 조회 실패 예외는 비로그인 상태로 처리한다.
 */
async function resolveSessionOrNull(requestHeaders: Headers) {
  try {
    return await auth.api.getSession({
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("[pages/items/:itemId] Failed to get session.", error);
    return null;
  }
}

function toPostgresErrorLike(error: unknown): PostgresErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as PostgresErrorLike;
}

/**
 * 아이템 수정 중 발생한 DB 예외를 HTTP 상태 코드/메시지로 정규화한다.
 */
function mapUpdateItemError(error: unknown) {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;
  const message = postgresError?.message ?? "Failed to update item.";

  if (code === "P0001") {
    return {
      status: 422,
      message,
    };
  }

  if (code === "23503") {
    return {
      status: 422,
      message: "Invalid item size.",
    };
  }

  return {
    status: 500,
    message: "Failed to update item.",
  };
}

/**
 * 아이템 삭제 중 발생한 DB 예외를 HTTP 상태 코드/메시지로 정규화한다.
 */
function mapDeleteItemError(error: unknown) {
  const postgresError = toPostgresErrorLike(error);
  const code = postgresError?.code;
  const message = postgresError?.message ?? "Failed to delete item.";

  if (code === "P0001") {
    return {
      status: 422,
      message,
    };
  }

  return {
    status: 500,
    message: "Failed to delete item.",
  };
}

/**
 * 소유한 페이지의 아이템을 수정한다.
 * 현재는 memo content 수정과 size_code 수정을 지원한다.
 */
export async function PATCH(request: Request, context: UpdateItemRouteContext) {
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

  const { handle, itemId } = await context.params;
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

  const parsedItemId = itemIdSchema.safeParse(itemId);

  if (!parsedItemId.success) {
    return Response.json(
      {
        status: "error",
        message: parsedItemId.error.issues[0]?.message ?? "Invalid item id.",
      },
      { status: 400 },
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

  const parsedBody = pageItemUpdateSchema.safeParse(rawBody);

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
    const updatedItem =
      parsedBody.data.type === "memo"
        ? await updateOwnedMemoItem({
            storedHandle,
            userId: session.user.id,
            itemId: parsedItemId.data,
            content: parsedBody.data.data.content,
          })
        : await updateOwnedPageItemSize({
            storedHandle,
            userId: session.user.id,
            itemId: parsedItemId.data,
            sizeCode: parsedBody.data.data.sizeCode,
          });

    if (!updatedItem) {
      return Response.json(
        {
          status: "error",
          message: "Item not found.",
        },
        { status: 404 },
      );
    }

    return Response.json({
      status: "success",
      item: updatedItem,
    });
  } catch (error) {
    const mappedError = mapUpdateItemError(error);

    return Response.json(
      {
        status: "error",
        message: mappedError.message,
      },
      { status: mappedError.status },
    );
  }
}

/**
 * 소유한 페이지의 아이템 1개를 물리 삭제한다.
 */
export async function DELETE(_request: Request, context: UpdateItemRouteContext) {
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

  const { handle, itemId } = await context.params;
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

  const parsedItemId = itemIdSchema.safeParse(itemId);

  if (!parsedItemId.success) {
    return Response.json(
      {
        status: "error",
        message: parsedItemId.error.issues[0]?.message ?? "Invalid item id.",
      },
      { status: 400 },
    );
  }

  try {
    const deletedItem = await deleteOwnedPageItem({
      storedHandle,
      userId: session.user.id,
      itemId: parsedItemId.data,
    });

    if (!deletedItem) {
      return Response.json(
        {
          status: "error",
          message: "Item not found.",
        },
        { status: 404 },
      );
    }

    return Response.json({
      status: "success",
      item: deletedItem,
    });
  } catch (error) {
    const mappedError = mapDeleteItemError(error);

    return Response.json(
      {
        status: "error",
        message: mappedError.message,
      },
      { status: mappedError.status },
    );
  }
}
