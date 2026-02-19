import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ReadonlyPageItemSection } from "@/components/public-page/readonly-page-item-section";
import type { VisiblePageItem } from "@/service/page/items";

vi.mock("@/components/ui/map", () => ({
  Map: () => null,
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

describe("ReadonlyPageItemSection", () => {
  test("memo 아이템은 카드 내부에서 overflow를 막고 본문 영역을 스크롤 가능하게 렌더링한다", () => {
    // Arrange
    const items: VisiblePageItem[] = [
      {
        id: "memo-1",
        typeCode: "memo",
        sizeCode: "wide-tall",
        orderKey: 1,
        data: {
          content: "A".repeat(300),
        },
        createdAt: "2026-02-18T00:00:00.000Z",
        updatedAt: "2026-02-18T00:00:00.000Z",
      },
    ];

    // Act
    const { container } = render(<ReadonlyPageItemSection items={items} />);
    const memoCard = container.querySelector('article[data-item-type="memo"]');
    const memoText = memoCard?.querySelector("p");

    // Assert
    expect(memoCard?.className).toContain("overflow-hidden");
    expect(memoText?.className).toContain("overflow-y-auto");
    expect(memoText?.className).toContain("scrollbar-hide");
  });

  test("section 아이템은 bg 투명 + mt-4 + bold 텍스트로 렌더링한다", () => {
    // Arrange
    const items: VisiblePageItem[] = [
      {
        id: "section-1",
        typeCode: "section",
        sizeCode: "wide-short",
        orderKey: 1,
        data: {
          content: "Section title",
        },
        createdAt: "2026-02-18T00:00:00.000Z",
        updatedAt: "2026-02-18T00:00:00.000Z",
      },
    ];

    // Act
    const { container } = render(<ReadonlyPageItemSection items={items} />);
    const sectionCard = container.querySelector('article[data-item-type="section"]');
    const sectionText = sectionCard?.querySelector("p");

    // Assert
    expect(sectionCard?.className).toContain("bg-transparent");
    expect(sectionCard?.className).toContain("mt-4");
    expect(sectionCard?.className).toContain("h-auto");
    expect(sectionText?.className).toContain("font-bold");
    expect(sectionText?.className).toContain("text-lg");
  });
});
