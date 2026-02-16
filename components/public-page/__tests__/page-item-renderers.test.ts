import { fireEvent, render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { getPageItemRenderer, resolvePageItemDisplayText } from "@/components/public-page/page-item-renderers";
import type { PageItem } from "@/hooks/use-page-item-composer";

vi.mock("@/components/ui/map", () => ({
  Map: ({ children, viewport }: { children?: ReactNode; viewport?: { center?: [number, number]; zoom?: number } }) =>
    createElement(
      "div",
      {
        "data-testid": "map-canvas",
        "data-center-lng": viewport?.center?.[0] ?? "",
        "data-center-lat": viewport?.center?.[1] ?? "",
        "data-zoom": viewport?.zoom ?? "",
      },
      children,
    ),
}));

vi.mock("@/components/public-page/page-item-location-dialog", () => ({
  PageItemLocationDialog: ({ trigger }: { trigger: ReactNode }) => createElement("div", { "data-testid": "map-edit-dialog" }, trigger),
}));

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

  test("image 렌더러는 src가 있으면 실제 이미지 태그를 렌더링한다", () => {
    // Arrange
    const imageSource = "https://example.com/image.webp";
    const item = createItem({
      typeCode: "image",
      data: {
        alt: "Profile image",
        src: imageSource,
      },
    });
    const ImageRenderer = getPageItemRenderer("image");

    // Act
    render(ImageRenderer({ item }));
    const image = screen.getByRole("img", { name: "Profile image" });
    const optimizedSource = image.getAttribute("src");

    // Assert
    expect(optimizedSource).toContain(encodeURIComponent(imageSource));
  });

  test("map 타입은 caption/googleMapUrl 순서로 텍스트를 선택한다", () => {
    // Arrange
    const item = createItem({
      typeCode: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        caption: "Seoul City Hall",
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    });

    // Act
    const result = resolvePageItemDisplayText(item);

    // Assert
    expect(result).toBe("Seoul City Hall");
  });

  test("map 렌더러는 지도/caption/구글맵 링크/편집 버튼을 표시한다", () => {
    // Arrange
    const onMapSave = vi.fn().mockResolvedValue(true);
    const item = createItem({
      typeCode: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        caption: "Seoul City Hall",
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    });
    const MapRenderer = getPageItemRenderer("map");

    // Act
    render(
      MapRenderer({
        item,
        canEditMap: true,
        onMapSave,
      }),
    );

    // Assert
    expect(screen.getByTestId("map-canvas")).toBeTruthy();
    expect(screen.getByText("Seoul City Hall")).toBeTruthy();
  });

  test("map 데이터 변경 시 렌더러는 최신 viewport를 즉시 전달한다", () => {
    // Arrange
    const MapRenderer = getPageItemRenderer("map");
    const beforeItem = createItem({
      id: "item-map-1",
      typeCode: "map",
      data: {
        lat: 37.5665,
        lng: 126.978,
        zoom: 13,
        caption: "Before",
        googleMapUrl: "https://www.google.com/maps?q=37.566500,126.978000&z=13",
      },
    });
    const afterItem = createItem({
      id: "item-map-1",
      typeCode: "map",
      data: {
        lat: 35.1796,
        lng: 129.0756,
        zoom: 15,
        caption: "After",
        googleMapUrl: "https://www.google.com/maps?q=35.179600,129.075600&z=15",
      },
    });

    // Act
    const { rerender } = render(MapRenderer({ item: beforeItem }));
    rerender(MapRenderer({ item: afterItem }));
    const mapCanvas = screen.getAllByTestId("map-canvas").at(-1);

    // Assert
    expect(mapCanvas?.getAttribute("data-center-lng")).toBe("129.0756");
    expect(mapCanvas?.getAttribute("data-center-lat")).toBe("35.1796");
    expect(mapCanvas?.getAttribute("data-zoom")).toBe("15");
  });

  test("video 렌더러는 자동 재생 속성(preload/playsInline/muted/loop/autoPlay)을 적용한다", () => {
    // Arrange
    const VideoRenderer = getPageItemRenderer("video");
    const item = createItem({
      typeCode: "video",
      data: {
        src: "https://example.com/video.mp4",
        mimeType: "video/mp4",
      },
    });

    // Act
    const { container } = render(VideoRenderer({ item }));
    const videoElement = container.querySelector("video");
    const sourceElement = container.querySelector("source");

    // Assert
    expect(videoElement).toBeTruthy();
    expect(videoElement?.getAttribute("preload")).toBe("metadata");
    expect(videoElement?.hasAttribute("playsinline")).toBe(true);
    expect(videoElement?.muted).toBe(true);
    expect(videoElement?.loop).toBe(true);
    expect(videoElement?.autoplay).toBe(true);
    expect(sourceElement?.getAttribute("src")).toBe("https://example.com/video.mp4");
  });
});
