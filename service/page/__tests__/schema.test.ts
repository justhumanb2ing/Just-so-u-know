import { describe, expect, test } from "vitest";
import {
  normalizeStoredHandleFromPath,
  pageItemCreateSchema,
  pageItemReorderSchema,
  pageItemUpdateSchema,
  pageSocialItemsUpsertSchema,
} from "@/service/page/schema";

describe("page item schema", () => {
  test("경로 handle을 저장 포맷으로 정규화한다", () => {
    // Arrange
    const pathHandle = "%40TeSter";

    // Act
    const result = normalizeStoredHandleFromPath(pathHandle);

    // Assert
    expect(result).toBe("@tester");
  });

  test("아이템 생성 스키마는 memo content 개행을 \\n으로 보존한다", () => {
    // Arrange
    const payload = {
      type: "memo",
      data: {
        content: "Hello\nWorld",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      type: "memo",
      data: {
        content: "Hello\nWorld",
      },
    });
  });

  test("아이템 생성 스키마는 공백만 있는 memo content를 거부한다", () => {
    // Arrange
    const payload = {
      type: "memo",
      data: {
        content: "  \n  ",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });

  test("아이템 생성 스키마는 map 데이터(lat/lng/zoom/caption/url)를 허용한다", () => {
    // Arrange
    const payload = {
      type: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        caption: "Seoul City Hall",
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  test("아이템 생성 스키마는 map caption 없이도 저장 가능하다", () => {
    // Arrange
    const payload = {
      type: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      type: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        caption: "",
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    });
  });

  test("아이템 생성 스키마는 image 데이터(src/mimeType/fileName/fileSize/objectKey)를 허용한다", () => {
    // Arrange
    const payload = {
      type: "image",
      data: {
        src: "https://example.com/media/image-1.webp",
        mimeType: "image/webp",
        fileName: "image-1.webp",
        fileSize: 1024,
        objectKey: "page-item/user-1/page-1/image/media-1.webp",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  test("아이템 생성 스키마는 video 데이터(src/mimeType/fileName/fileSize/objectKey)를 허용한다", () => {
    // Arrange
    const payload = {
      type: "video",
      data: {
        src: "https://example.com/media/video-1.mp4",
        mimeType: "video/mp4",
        fileName: "video-1.mp4",
        fileSize: 1024,
        objectKey: "page-item/user-1/page-1/video/media-1.mp4",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  test("아이템 생성 스키마는 5MB 초과 media fileSize를 거부한다", () => {
    // Arrange
    const payload = {
      type: "video",
      data: {
        src: "https://example.com/media/video-1.mp4",
        mimeType: "video/mp4",
        fileName: "video-1.mp4",
        fileSize: 5 * 1024 * 1024 + 1,
        objectKey: "page-item/user-1/page-1/video/media-1.mp4",
      },
    };

    // Act
    const result = pageItemCreateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });

  test("아이템 수정 스키마는 memo content 개행을 \\n으로 정규화한다", () => {
    // Arrange
    const payload = {
      type: "memo",
      data: {
        content: "Hello\r\nWorld",
      },
    };

    // Act
    const result = pageItemUpdateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      type: "memo",
      data: {
        content: "Hello\nWorld",
      },
    });
  });

  test("아이템 수정 스키마는 sizeCode를 허용 목록으로 검증한다", () => {
    // Arrange
    const payload = {
      type: "size",
      data: {
        sizeCode: "wide-full",
      },
    };

    // Act
    const result = pageItemUpdateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      type: "size",
      data: {
        sizeCode: "wide-full",
      },
    });
  });

  test("아이템 수정 스키마는 map 데이터(lat/lng/zoom/caption/url)를 허용한다", () => {
    // Arrange
    const payload = {
      type: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        caption: "Seoul City Hall",
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    };

    // Act
    const result = pageItemUpdateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  test("아이템 수정 스키마는 map caption 없이도 저장 가능하다", () => {
    // Arrange
    const payload = {
      type: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    };

    // Act
    const result = pageItemUpdateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      type: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        caption: "",
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    });
  });

  test("아이템 수정 스키마는 잘못된 sizeCode를 거부한다", () => {
    // Arrange
    const payload = {
      type: "size",
      data: {
        sizeCode: "invalid-size",
      },
    };

    // Act
    const result = pageItemUpdateSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });

  test("아이템 정렬 스키마는 전체 item id 배열을 허용한다", () => {
    // Arrange
    const payload = {
      itemIds: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"],
    };

    // Act
    const result = pageItemReorderSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payload);
  });

  test("아이템 정렬 스키마는 중복 item id를 거부한다", () => {
    // Arrange
    const payload = {
      itemIds: ["11111111-1111-4111-8111-111111111111", "11111111-1111-4111-8111-111111111111"],
    };

    // Act
    const result = pageItemReorderSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });

  test("소셜 계정 저장 스키마는 빈 식별자를 제외하고 플랫폼 기준으로 병합한다", () => {
    // Arrange
    const payload = {
      items: [
        { platform: "x", username: "  @first  " },
        { platform: "github", username: "   " },
        { platform: "x", username: "  @second  " },
        { platform: "chzzk", username: "  @channel-id  " },
      ],
    };

    // Act
    const result = pageSocialItemsUpsertSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.items).toEqual([
      { platform: "x", username: "second" },
      { platform: "chzzk", username: "@channel-id" },
    ]);
  });

  test("소셜 계정 저장 스키마는 허용되지 않은 플랫폼 값을 거부한다", () => {
    // Arrange
    const payload = {
      items: [{ platform: "not-supported", username: "tester" }],
    };

    // Act
    const result = pageSocialItemsUpsertSchema.safeParse(payload);

    // Assert
    expect(result.success).toBe(false);
  });
});
