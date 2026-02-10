import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseS3Client, getSupabaseS3Config } from "@/lib/supabase-s3-storage";
import { buildPageImageObjectKey, extractPageImageObjectKey } from "@/service/onboarding/page-image";
import { updateOwnedPageImage } from "@/service/onboarding/public-page";
import { authorizePageImageRequest } from "../route-utils";

export const runtime = "nodejs";

/**
 * page.image를 null로 갱신하고 Storage object 삭제를 시도한다.
 */
export async function DELETE(request: Request) {
  const authResult = await authorizePageImageRequest(request);

  if (authResult.status === "error") {
    return authResult.response;
  }

  let s3Config: ReturnType<typeof getSupabaseS3Config>;
  let s3Client: ReturnType<typeof getSupabaseS3Client>;

  try {
    s3Config = getSupabaseS3Config();
    s3Client = getSupabaseS3Client();
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Image storage is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const updatedPage = await updateOwnedPageImage({
      storedHandle: authResult.storedHandle,
      userId: authResult.userId,
      image: null,
    });

    if (!updatedPage) {
      return Response.json(
        {
          status: "error",
          message: "You do not have permission to update this page.",
        },
        { status: 403 },
      );
    }

    const keysToDelete = new Set<string>();
    keysToDelete.add(
      buildPageImageObjectKey({
        userId: authResult.userId,
        pageId: authResult.ownedPage.id,
      }),
    );

    const storedImageObjectKey = extractPageImageObjectKey(authResult.ownedPage.image, s3Config.bucketName);
    if (storedImageObjectKey) {
      keysToDelete.add(storedImageObjectKey);
    }

    const deleteResults = await Promise.allSettled(
      Array.from(keysToDelete).map((key) =>
        s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3Config.bucketName,
            Key: key,
          }),
        ),
      ),
    );
    const hasDeleteFailure = deleteResults.some((result) => result.status === "rejected");

    if (hasDeleteFailure) {
      return Response.json({
        status: "partial_success",
        message: "Image removed from profile, but storage cleanup failed.",
      });
    }

    return Response.json({
      status: "success",
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Failed to delete image.",
      },
      { status: 500 },
    );
  }
}
