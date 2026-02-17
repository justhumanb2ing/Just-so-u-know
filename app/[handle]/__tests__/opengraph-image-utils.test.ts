import { describe, expect, it } from "vitest";
import { toRenderableOpenGraphImageUrl } from "@/app/[handle]/opengraph-image-utils";

describe("toRenderableOpenGraphImageUrl", () => {
  it("png/jpg/jpeg URL은 그대로 반환해야 한다", () => {
    // Arrange
    const pngImageUrl = "https://cdn.example.com/profile.png";
    const jpgImageUrl = "https://cdn.example.com/profile.jpg";
    const jpegImageUrl = "https://cdn.example.com/profile.jpeg";

    // Act
    const pngResult = toRenderableOpenGraphImageUrl(pngImageUrl);
    const jpgResult = toRenderableOpenGraphImageUrl(jpgImageUrl);
    const jpegResult = toRenderableOpenGraphImageUrl(jpegImageUrl);

    // Assert
    expect(pngResult).toBe(pngImageUrl);
    expect(jpgResult).toBe(jpgImageUrl);
    expect(jpegResult).toBe(jpegImageUrl);
  });

  it("webp URL은 null을 반환해야 한다", () => {
    // Arrange
    const webpImageUrl = "https://cdn.example.com/profile.webp?v=123";

    // Act
    const result = toRenderableOpenGraphImageUrl(webpImageUrl);

    // Assert
    expect(result).toBeNull();
  });

  it("잘못된 URL 또는 빈 값은 null을 반환해야 한다", () => {
    // Arrange
    const invalidImageUrl = "not-a-url";
    const emptyImageUrl = "  ";

    // Act
    const invalidResult = toRenderableOpenGraphImageUrl(invalidImageUrl);
    const emptyResult = toRenderableOpenGraphImageUrl(emptyImageUrl);
    const nullResult = toRenderableOpenGraphImageUrl(null);

    // Assert
    expect(invalidResult).toBeNull();
    expect(emptyResult).toBeNull();
    expect(nullResult).toBeNull();
  });
});
