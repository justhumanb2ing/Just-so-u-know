import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import CopyUrlButton, { resolveShareTrackingPath } from "@/components/layout/copy-button";
import { useCopyCurrentRouteUrl } from "@/hooks/use-copy-current-route-url";
import { trackFeatureUse } from "@/service/analytics/tracker";

vi.mock("@/hooks/use-copy-current-route-url", () => ({
  useCopyCurrentRouteUrl: vi.fn(),
}));
vi.mock("@/service/analytics/tracker", () => ({
  trackFeatureUse: vi.fn(),
}));

const mockedUseCopyCurrentRouteUrl = vi.mocked(useCopyCurrentRouteUrl);
const mockedTrackFeatureUse = vi.mocked(trackFeatureUse);

describe("CopyUrlButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test("복사 성공 시 loading -> success -> 1.5초 뒤 idle 아이콘으로 복귀한다", async () => {
    // Arrange
    let resolveCopy: ((value: boolean) => void) | null = null;
    const copyCurrentRouteUrl = vi.fn().mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveCopy = resolve;
        }),
    );

    mockedUseCopyCurrentRouteUrl.mockReturnValue({
      currentRouteUrl: "https://justsouknow.me/@owner",
      copyCurrentRouteUrl,
    });

    render(<CopyUrlButton />);
    const button = screen.getByRole("button", {
      name: "Copy current page URL",
    });

    // Act
    fireEvent.click(button);

    // Assert
    expect(copyCurrentRouteUrl).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("copy-url-icon-pending")).toBeTruthy();
    expect(button.hasAttribute("disabled")).toBe(true);

    // Act
    await act(async () => {
      resolveCopy?.(true);
      await Promise.resolve();
    });

    // Assert
    expect(screen.getByTestId("copy-url-icon-success")).toBeTruthy();
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(mockedTrackFeatureUse).toHaveBeenCalledWith({
      featureName: "share_copy_url",
      actorType: "owner",
      context: {
        path: "/@owner",
      },
    });

    // Act
    act(() => {
      vi.advanceTimersByTime(1499);
    });

    // Assert
    expect(screen.getByTestId("copy-url-icon-success")).toBeTruthy();

    // Act
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Assert
    expect(screen.getByTestId("copy-url-icon-idle")).toBeTruthy();
  });

  test("외부에서 className, size, variant를 주입하면 버튼 스타일에 반영된다", () => {
    // Arrange
    mockedUseCopyCurrentRouteUrl.mockReturnValue({
      currentRouteUrl: "https://justsouknow.me/@owner",
      copyCurrentRouteUrl: vi.fn().mockResolvedValue(true),
    });

    // Act
    render(<CopyUrlButton className="custom-copy-button" size="icon" variant="ghost" />);
    const buttons = screen.getAllByRole("button", {
      name: "Copy current page URL",
    });
    const button = buttons.at(-1);

    // Assert
    expect(button).toBeTruthy();
    expect(button?.className).toContain("custom-copy-button");
    expect(button?.className).toContain("size-9");
    expect(button?.className).toContain("hover:bg-muted");
  });
});

describe("resolveShareTrackingPath", () => {
  test("절대 URL에서 path+query를 추출한다", () => {
    // Arrange
    const currentRouteUrl = "https://justsouknow.me/@owner?tab=links#profile";

    // Act
    const result = resolveShareTrackingPath(currentRouteUrl);

    // Assert
    expect(result).toBe("/@owner?tab=links");
  });

  test("잘못된 URL이면 기본 경로를 반환한다", () => {
    // Arrange
    const currentRouteUrl = "not-a-url";

    // Act
    const result = resolveShareTrackingPath(currentRouteUrl);

    // Assert
    expect(result).toBe("/");
  });
});
