import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSupabaseS3Client, getSupabaseS3Config } from "@/lib/supabase-s3-storage";
import { buildPageImageObjectKey, PAGE_IMAGE_OUTPUT_MIME_TYPE } from "@/service/onboarding/page-image";
import { authorizePageImageRequest } from "../route-utils";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * presigned PUT URL을 발급해 클라이언트가 Storage에 직접 업로드하도록 한다.
 */
export async function POST(request: Request) {
  const authResult = await authorizePageImageRequest(request);

  if (authResult.status === "error") {
    return authResult.response;
  }

  try {
    const s3Config = getSupabaseS3Config();
    const s3Client = getSupabaseS3Client();
    const objectKey = buildPageImageObjectKey({
      userId: authResult.userId,
      pageId: authResult.ownedPage.id,
    });

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: objectKey,
        ContentType: PAGE_IMAGE_OUTPUT_MIME_TYPE,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: SIGNED_URL_TTL_SECONDS },
    );

    return Response.json({
      status: "success",
      uploadUrl,
      uploadHeaders: {
        "Content-Type": PAGE_IMAGE_OUTPUT_MIME_TYPE,
      },
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Failed to initialize image upload.",
      },
      { status: 500 },
    );
  }
}
