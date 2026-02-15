import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSupabaseS3Client, getSupabaseS3Config } from "@/lib/supabase-s3-storage";
import {
  buildPageItemMediaObjectKeyPrefix,
  buildPageItemMediaPublicUrl,
  PAGE_ITEM_MEDIA_BUCKET_NAME,
  PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES,
  resolvePageItemMediaTypeFromMimeType,
} from "@/service/page/item-media";
import { authorizePageItemMediaRequest, parsePageItemMediaCompleteUploadInput } from "../route-utils";

export const runtime = "nodejs";

/**
 * 업로드 완료 이후 object 존재/소유 범위를 확인하고 public URL을 반환한다.
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

  let parsedBody: ReturnType<typeof parsePageItemMediaCompleteUploadInput>;

  try {
    parsedBody = parsePageItemMediaCompleteUploadInput(rawBody);
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

  const expectedObjectKeyPrefix = buildPageItemMediaObjectKeyPrefix(authResult.userId, authResult.ownedPage.id);

  if (!parsedBody.objectKey.startsWith(`${expectedObjectKeyPrefix}/`)) {
    return Response.json(
      {
        status: "error",
        message: "Invalid media object key.",
      },
      { status: 403 },
    );
  }

  let s3Config: ReturnType<typeof getSupabaseS3Config>;
  let s3Client: ReturnType<typeof getSupabaseS3Client>;

  try {
    s3Config = getSupabaseS3Config({
      bucketName: PAGE_ITEM_MEDIA_BUCKET_NAME,
    });
    s3Client = getSupabaseS3Client();
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Media storage is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const headResponse = await s3Client.send(
      new HeadObjectCommand({
        Bucket: s3Config.bucketName,
        Key: parsedBody.objectKey,
      }),
    );
    const contentLength = typeof headResponse.ContentLength === "number" ? headResponse.ContentLength : null;

    if (contentLength !== null && contentLength > PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES) {
      return Response.json(
        {
          status: "error",
          message: "Media file is too large.",
        },
        { status: 422 },
      );
    }
  } catch {
    return Response.json(
      {
        status: "error",
        message: "Uploaded media was not found. Please try again.",
      },
      { status: 400 },
    );
  }

  const mediaUrl = buildPageItemMediaPublicUrl({
    publicObjectBaseUrl: s3Config.publicObjectBaseUrl,
    bucketName: s3Config.bucketName,
    objectKey: parsedBody.objectKey,
    version: Date.now().toString(),
  });

  return Response.json({
    status: "success",
    media: {
      type: mediaType,
      src: mediaUrl,
      mimeType: parsedBody.mimeType,
      fileName: parsedBody.fileName,
      fileSize: parsedBody.fileSize,
      objectKey: parsedBody.objectKey,
    },
  });
}
