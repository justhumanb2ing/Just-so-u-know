import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import CopyUrlButton from "@/components/layout/copy-button";
import { useCopyCurrentRouteUrl } from "@/hooks/use-copy-current-route-url";

vi.mock("@/hooks/use-copy-current-route-url", () => ({
  useCopyCurrentRouteUrl: vi.fn(),
}));

const mockedUseCopyCurrentRouteUrl = vi.mocked(useCopyCurrentRouteUrl);

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
      currentRouteUrl: "https://tsuki.app/@owner",
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
});
