import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { getPageItemRenderer, resolvePageItemDisplayText } from "@/components/public-page/page-item-renderers";
import type { PageItem } from "@/hooks/use-page-item-composer";

function createItem(input: Partial<PageItem>): PageItem {
  return {
    id: "item-1",
    typeCode: "memo",
    sizeCode: "wide-short",
    orderKey: 1,
    data: {},
    createdAt: "2026-02-12T00:00:00.000Z",
    updatedAt: "2026-02-12T00:00:00.000Z",
    ...input,
  };
}

describe("page item renderers", () => {
  test("memo 타입은 content 필드를 우선 렌더링한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "memo",
      data: {
        content: "memo content",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("memo content");
  });

  test("link 타입은 title/url 순서로 텍스트를 선택한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "link",
      data: {
        title: "My Link",
        url: "https://example.com",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("My Link");
  });

  test("link 렌더러는 favicon이 없으면 /no-favicon.png를 사용한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "link",
      data: {
        title: "My Link",
        url: "https://example.com",
      },
    });
    const LinkRenderer = getPageItemRenderer("link");

    // Act
    render(LinkRenderer({ item }));
    const favicon = screen.getByRole("img", { name: "My Link favicon" });

    // Assert
    expect(favicon.getAttribute("src")).toBe("/no-favicon.png");
  });

  test("소유자 모드 link title textarea에서 Enter 입력 시 저장 콜백을 호출한다", () => {
    // Arrange
    const onLinkTitleSubmit = vi.fn();
    const onLinkTitleChange = vi.fn();
    const item = createItem({
      typeCode: "link",
      data: {
        title: "My Link",
        url: "https://example.com",
      },
    });
    const LinkRenderer = getPageItemRenderer("link");

    // Act
    render(
      LinkRenderer({
        item,
        canEditLinkTitle: true,
        onLinkTitleChange,
        onLinkTitleSubmit,
      }),
    );
    const inputs = screen.getAllByPlaceholderText("Title");
    const editableInput = inputs.find((input) => input.getAttribute("readonly") === null) ?? inputs[0];

    if (!editableInput) {
      throw new Error("Editable link title input not found");
    }

    fireEvent.keyDown(editableInput, { key: "Enter", code: "Enter" });

    // Assert
    expect(onLinkTitleSubmit).toHaveBeenCalledTimes(1);
    expect(onLinkTitleSubmit).toHaveBeenCalledWith("item-1");
  });

  test("image 타입은 alt/caption/title/src 순서로 텍스트를 선택한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "image",
      data: {
        alt: "Profile image",
        src: "https://example.com/image.webp",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("Profile image");
  });

  test("미지원 타입은 첫 번째 문자열 primitive를 fallback으로 사용한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "video",
      data: {
        url: "https://example.com/video.mp4",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("https://example.com/video.mp4");
  });
});
