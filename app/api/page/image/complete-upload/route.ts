import { DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseS3Client, getSupabaseS3Config } from "@/lib/supabase-s3-storage";
import { buildPageImageObjectKey, buildPageImagePublicUrl, extractPageImageObjectKey } from "@/service/onboarding/page-image";
import { updateOwnedPageImage } from "@/service/onboarding/public-page";
import { authorizePageImageRequest } from "../route-utils";

export const runtime = "nodejs";

/**
 * 업로드 완료 이후 object 존재를 확인하고 page.image URL을 확정 저장한다.
 */
export async function POST(request: Request) {
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

  const objectKey = buildPageImageObjectKey({
    userId: authResult.userId,
    pageId: authResult.ownedPage.id,
  });

  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: s3Config.bucketName,
        Key: objectKey,
      }),
    );
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Uploaded image was not found. Please try again.",
      },
      { status: 400 },
    );
  }

  const imageUrl = buildPageImagePublicUrl({
    publicObjectBaseUrl: s3Config.publicObjectBaseUrl,
    bucketName: s3Config.bucketName,
    objectKey,
    version: Date.now().toString(),
  });

  try {
    const updatedPage = await updateOwnedPageImage({
      storedHandle: authResult.storedHandle,
      userId: authResult.userId,
      image: imageUrl,
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

    const previousObjectKey = extractPageImageObjectKey(authResult.ownedPage.image, s3Config.bucketName);
    if (previousObjectKey && previousObjectKey !== objectKey) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3Config.bucketName,
            Key: previousObjectKey,
          }),
        );
      } catch {
        return Response.json({
          status: "partial_success",
          imageUrl,
          message: "Image updated, but previous object cleanup failed.",
        });
      }
    }

    return Response.json({
      status: "success",
      imageUrl,
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Failed to complete image upload.",
      },
      { status: 500 },
    );
  }
}
