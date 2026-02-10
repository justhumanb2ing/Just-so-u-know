export const PAGE_IMAGE_BUCKET_NAME = "page-thumbnail";
export const PAGE_IMAGE_FILE_NAME = "profile.webp";
export const PAGE_IMAGE_OUTPUT_MIME_TYPE = "image/webp";
export const PAGE_IMAGE_ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
export const PAGE_IMAGE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type BuildPageImageObjectKeyInput = {
  userId: string;
  pageId: string;
};

type BuildPageImagePublicUrlInput = {
  publicObjectBaseUrl: string;
  bucketName: string;
  objectKey: string;
  version: string;
};

/**
 * 페이지 프로필 이미지 저장 키를 고정 규칙으로 생성한다.
 */
export function buildPageImageObjectKey({ userId, pageId }: BuildPageImageObjectKeyInput) {
  return `page/${userId}/${pageId}/${PAGE_IMAGE_FILE_NAME}`;
}

/**
 * Supabase S3 엔드포인트에서 public object URL base를 계산한다.
 */
export function buildPublicObjectBaseUrlFromS3Endpoint(s3Endpoint: string) {
  const endpointUrl = new URL(s3Endpoint);
  return new URL("/storage/v1/object/public", endpointUrl.origin).toString();
}

/**
 * 캐시 무효화 버전을 포함한 public image URL을 생성한다.
 */
export function buildPageImagePublicUrl({ publicObjectBaseUrl, bucketName, objectKey, version }: BuildPageImagePublicUrlInput) {
  const normalizedBaseUrl = publicObjectBaseUrl.endsWith("/") ? publicObjectBaseUrl : `${publicObjectBaseUrl}/`;
  const imageUrl = new URL(`${bucketName}/${objectKey}`, normalizedBaseUrl);
  imageUrl.searchParams.set("v", version);

  return imageUrl.toString();
}

/**
 * page.image URL에서 bucket 기준 object key를 추출한다.
 */
export function extractPageImageObjectKey(imageUrl: string | null | undefined, bucketName: string) {
  if (!imageUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const prefix = `/storage/v1/object/public/${bucketName}/`;

    if (!parsedUrl.pathname.startsWith(prefix)) {
      return null;
    }

    const objectKey = parsedUrl.pathname.slice(prefix.length);
    return objectKey.length > 0 ? decodeURIComponent(objectKey) : null;
  } catch {
    return null;
  }
}

/**
 * 파일 MIME 타입이 허용된 이미지 형식인지 확인한다.
 */
export function isAllowedPageImageMimeType(mimeType: string) {
  return PAGE_IMAGE_ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

/**
 * 파일 크기가 정책(최대 5MB) 이내인지 확인한다.
 */
export function isAllowedPageImageFileSize(fileSize: number) {
  return fileSize > 0 && fileSize <= PAGE_IMAGE_MAX_FILE_SIZE_BYTES;
}
