import { describe, expect, it } from "vitest";
import { buildConnectedSocialLinkItems } from "@/components/public-page/connected-social-items";

describe("connected social items", () => {
  it("profileUrlTemplate 기반으로 플랫폼 링크를 생성한다", () => {
    // Arrange
    const items = [{ platform: "x", username: "@tsuki" }];

    // Act
    const result = buildConnectedSocialLinkItems(items);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: "x-https://x.com/tsuki",
      href: "https://x.com/tsuki",
      label: "X",
      iconClassName: "size-7! fill-white",
    });
  });

  it("유효하지 않은 플랫폼 또는 빈 식별자는 렌더링 목록에서 제외한다", () => {
    // Arrange
    const items = [
      { platform: "unknown", username: "tsuki" },
      { platform: "x", username: "   " },
    ];

    // Act
    const result = buildConnectedSocialLinkItems(items);

    // Assert
    expect(result).toEqual([]);
  });
});
