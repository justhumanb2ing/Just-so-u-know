import { describe, expect, test } from "vitest";
import {
  buildPageImageObjectKey,
  buildPageImagePublicUrl,
  buildPublicObjectBaseUrlFromS3Endpoint,
  extractPageImageObjectKey,
  isAllowedPageImageFileSize,
  isAllowedPageImageMimeType,
} from "@/service/onboarding/page-image";

describe("page-image", () => {
  test("사용자/페이지 식별자로 고정 object key를 생성한다", () => {
    // Arrange
    const payload = {
      userId: "user-1",
      pageId: "page-1",
    };

    // Act
    const objectKey = buildPageImageObjectKey(payload);

    // Assert
    expect(objectKey).toBe("page/user-1/page-1/profile.jpg");
  });

  test("S3 endpoint에서 public object base URL을 계산한다", () => {
    // Arrange
    const endpoint = "https://project-ref.storage.supabase.co/storage/v1/s3";

    // Act
    const baseUrl = buildPublicObjectBaseUrlFromS3Endpoint(endpoint);

    // Assert
    expect(baseUrl).toBe("https://project-ref.storage.supabase.co/storage/v1/object/public");
  });

  test("public image URL에 캐시 버전 파라미터를 붙인다", () => {
    // Arrange
    const payload = {
      publicObjectBaseUrl: "https://project-ref.storage.supabase.co/storage/v1/object/public",
      bucketName: "page-thumbnail",
      objectKey: "page/user-1/page-1/profile.jpg",
      version: "1739156400000",
    };

    // Act
    const imageUrl = buildPageImagePublicUrl(payload);

    // Assert
    expect(imageUrl).toBe(
      "https://project-ref.storage.supabase.co/storage/v1/object/public/page-thumbnail/page/user-1/page-1/profile.jpg?v=1739156400000",
    );
  });

  test("page.image URL에서 object key를 추출한다", () => {
    // Arrange
    const imageUrl =
      "https://project-ref.storage.supabase.co/storage/v1/object/public/page-thumbnail/page/user-1/page-1/profile.jpg?v=1739156400000";

    // Act
    const objectKey = extractPageImageObjectKey(imageUrl, "page-thumbnail");

    // Assert
    expect(objectKey).toBe("page/user-1/page-1/profile.jpg");
  });

  test("다른 bucket URL이면 object key를 추출하지 않는다", () => {
    // Arrange
    const imageUrl = "https://project-ref.storage.supabase.co/storage/v1/object/public/other-bucket/path/profile.jpg";

    // Act
    const objectKey = extractPageImageObjectKey(imageUrl, "page-thumbnail");

    // Assert
    expect(objectKey).toBeNull();
  });

  test("허용 MIME 타입(jpeg/png/webp)만 통과한다", () => {
    // Arrange
    const allowedMimeType = "image/jpeg";
    const deniedMimeType = "image/gif";

    // Act
    const allowed = isAllowedPageImageMimeType(allowedMimeType);
    const denied = isAllowedPageImageMimeType(deniedMimeType);

    // Assert
    expect(allowed).toBe(true);
    expect(denied).toBe(false);
  });

  test("파일 크기는 0 초과 5MB 이하만 통과한다", () => {
    // Arrange
    const validSize = 5 * 1024 * 1024;
    const invalidSize = 5 * 1024 * 1024 + 1;

    // Act
    const valid = isAllowedPageImageFileSize(validSize);
    const invalid = isAllowedPageImageFileSize(invalidSize);

    // Assert
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});
