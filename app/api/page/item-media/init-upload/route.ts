import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSupabaseS3Client, getSupabaseS3Config } from "@/lib/supabase-s3-storage";
import { buildPageItemMediaObjectKey, PAGE_ITEM_MEDIA_BUCKET_NAME, resolvePageItemMediaTypeFromMimeType } from "@/service/page/item-media";
import { authorizePageItemMediaRequest, parsePageItemMediaInitUploadInput } from "../route-utils";

export const runtime = "nodejs";

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * presigned PUT URL을 발급해 클라이언트가 페이지 아이템 미디어를 직접 업로드하도록 한다.
 */
export async function POST(request: Request) {
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

  let parsedBody: ReturnType<typeof parsePageItemMediaInitUploadInput>;

  try {
    parsedBody = parsePageItemMediaInitUploadInput(rawBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request payload.";
    return Response.json(
      {
        status: "error",
        message,
      },
      { status: 422 },
    );
  }

  const mediaType = resolvePageItemMediaTypeFromMimeType(parsedBody.mimeType);

  if (!mediaType) {
    return Response.json(
      {
        status: "error",
        message: "Unsupported media format.",
      },
      { status: 422 },
    );
  }

  const authResult = await authorizePageItemMediaRequest(parsedBody.handle);

  if (authResult.status === "error") {
    return authResult.response;
  }

  try {
    const s3Config = getSupabaseS3Config({
      bucketName: PAGE_ITEM_MEDIA_BUCKET_NAME,
    });
    const s3Client = getSupabaseS3Client();
    const objectKey = buildPageItemMediaObjectKey({
      userId: authResult.userId,
      pageId: authResult.ownedPage.id,
      mediaType,
      fileId: crypto.randomUUID(),
      mimeType: parsedBody.mimeType,
    });

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: objectKey,
        ContentType: parsedBody.mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: SIGNED_URL_TTL_SECONDS },
    );

    return Response.json({
      status: "success",
      uploadUrl,
      uploadHeaders: {
        "Content-Type": parsedBody.mimeType,
      },
      objectKey,
      mediaType,
      mimeType: parsedBody.mimeType,
      fileName: parsedBody.fileName,
      fileSize: parsedBody.fileSize,
    });
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Failed to initialize media upload.",
      },
      { status: 500 },
    );
  }
}
