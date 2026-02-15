export const PAGE_ITEM_MEDIA_BUCKET_NAME = "page-item-image-video";
export const PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const PAGE_ITEM_MEDIA_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/webm",
  "video/mp4",
]);

const MIME_TYPE_TO_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/webm": "webm",
  "video/mp4": "mp4",
};

type BuildPageItemMediaObjectKeyInput = {
  userId: string;
  pageId: string;
  mediaType: "image" | "video";
  fileId: string;
  mimeType: string;
};

type BuildPageItemMediaPublicUrlInput = {
  publicObjectBaseUrl: string;
  bucketName: string;
  objectKey: string;
  version: string;
};

/**
 * 파일 MIME 타입이 허용된 이미지/비디오 형식인지 확인한다.
 */
export function isAllowedPageItemMediaMimeType(mimeType: string) {
  return PAGE_ITEM_MEDIA_ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

/**
 * 파일 크기가 정책(최대 5MB) 이내인지 확인한다.
 */
export function isAllowedPageItemMediaFileSize(fileSize: number) {
  return fileSize > 0 && fileSize <= PAGE_ITEM_MEDIA_MAX_FILE_SIZE_BYTES;
}

/**
 * MIME 타입을 page_item 타입 코드(image/video)로 변환한다.
 */
export function resolvePageItemMediaTypeFromMimeType(mimeType: string): "image" | "video" | null {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.startsWith("image/")) {
    return "image";
  }

  if (normalizedMimeType.startsWith("video/")) {
    return "video";
  }

  return null;
}

/**
 * MIME 타입에서 object key 확장자를 계산한다.
 */
export function resolvePageItemMediaFileExtension(mimeType: string) {
  const normalizedMimeType = mimeType.toLowerCase();
  return MIME_TYPE_TO_EXTENSION_MAP[normalizedMimeType] ?? null;
}

/**
 * 페이지 미디어 object key prefix를 생성한다.
 */
export function buildPageItemMediaObjectKeyPrefix(userId: string, pageId: string) {
  return `page-item/${userId}/${pageId}`;
}

/**
 * 페이지 아이템 이미지/비디오 저장 키를 고정 규칙으로 생성한다.
 */
export function buildPageItemMediaObjectKey({ userId, pageId, mediaType, fileId, mimeType }: BuildPageItemMediaObjectKeyInput) {
  const extension = resolvePageItemMediaFileExtension(mimeType);

  if (!extension) {
    throw new Error("Unsupported media mime type.");
  }

  return `${buildPageItemMediaObjectKeyPrefix(userId, pageId)}/${mediaType}/${fileId}.${extension}`;
}

/**
 * 캐시 무효화 버전을 포함한 public media URL을 생성한다.
 */
export function buildPageItemMediaPublicUrl({ publicObjectBaseUrl, bucketName, objectKey, version }: BuildPageItemMediaPublicUrlInput) {
  const normalizedBaseUrl = publicObjectBaseUrl.endsWith("/") ? publicObjectBaseUrl : `${publicObjectBaseUrl}/`;
  const mediaUrl = new URL(`${bucketName}/${objectKey}`, normalizedBaseUrl);
  mediaUrl.searchParams.set("v", version);

  return mediaUrl.toString();
}
