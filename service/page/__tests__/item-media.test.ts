import { describe, expect, test } from "vitest";
import {
  buildPageItemMediaObjectKey,
  buildPageItemMediaObjectKeyPrefix,
  buildPageItemMediaPublicUrl,
  isAllowedPageItemMediaFileSize,
  isAllowedPageItemMediaMimeType,
  resolvePageItemMediaFileExtension,
  resolvePageItemMediaTypeFromMimeType,
} from "@/service/page/item-media";

describe("page item media", () => {
  test("허용 MIME 타입은 이미지/비디오 정책 목록만 통과한다", () => {
    // Arrange
    const allowedMimeType = "video/mp4";
    const deniedMimeType = "application/pdf";

    // Act
    const allowed = isAllowedPageItemMediaMimeType(allowedMimeType);
    const denied = isAllowedPageItemMediaMimeType(deniedMimeType);

    // Assert
    expect(allowed).toBe(true);
    expect(denied).toBe(false);
  });

  test("파일 크기는 0 초과 5MB 이하만 통과한다", () => {
    // Arrange
    const validSize = 5 * 1024 * 1024;
    const invalidSize = 5 * 1024 * 1024 + 1;

    // Act
    const valid = isAllowedPageItemMediaFileSize(validSize);
    const invalid = isAllowedPageItemMediaFileSize(invalidSize);

    // Assert
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  test("MIME 타입으로 image/video 타입 코드를 판별한다", () => {
    // Arrange

    // Act
    const imageType = resolvePageItemMediaTypeFromMimeType("image/png");
    const videoType = resolvePageItemMediaTypeFromMimeType("video/webm");
    const unsupportedType = resolvePageItemMediaTypeFromMimeType("application/json");

    // Assert
    expect(imageType).toBe("image");
    expect(videoType).toBe("video");
    expect(unsupportedType).toBeNull();
  });

  test("MIME 타입으로 object key 확장자를 계산한다", () => {
    // Arrange

    // Act
    const extension = resolvePageItemMediaFileExtension("image/webp");

    // Assert
    expect(extension).toBe("webp");
  });

  test("사용자/페이지/타입/파일 식별자로 object key를 생성한다", () => {
    // Arrange
    const payload = {
      userId: "user-1",
      pageId: "page-1",
      mediaType: "video" as const,
      fileId: "media-1",
      mimeType: "video/mp4",
    };

    // Act
    const objectKey = buildPageItemMediaObjectKey(payload);

    // Assert
    expect(objectKey).toBe("page-item/user-1/page-1/video/media-1.mp4");
  });

  test("object key prefix는 사용자/페이지 경로를 유지한다", () => {
    // Arrange

    // Act
    const prefix = buildPageItemMediaObjectKeyPrefix("user-1", "page-1");

    // Assert
    expect(prefix).toBe("page-item/user-1/page-1");
  });

  test("public media URL에 캐시 버전 파라미터를 붙인다", () => {
    // Arrange
    const payload = {
      publicObjectBaseUrl: "https://project-ref.storage.supabase.co/storage/v1/object/public",
      bucketName: "page-item-image-video",
      objectKey: "page-item/user-1/page-1/image/media-1.webp",
      version: "1739156400000",
    };

    // Act
    const mediaUrl = buildPageItemMediaPublicUrl(payload);

    // Assert
    expect(mediaUrl).toBe(
      "https://project-ref.storage.supabase.co/storage/v1/object/public/page-item-image-video/page-item/user-1/page-1/image/media-1.webp?v=1739156400000",
    );
  });
});
