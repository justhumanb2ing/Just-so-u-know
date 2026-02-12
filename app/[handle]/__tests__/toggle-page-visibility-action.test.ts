import { beforeEach, describe, expect, test, vi } from "vitest";

const { headersMock, getSessionMock, toggleOwnedPageVisibilityMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
  getSessionMock: vi.fn(),
  toggleOwnedPageVisibilityMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/service/onboarding/public-page", () => ({
  updateOwnedPageHandle: vi.fn(),
  updateOwnedPageProfile: vi.fn(),
  toggleOwnedPageVisibility: toggleOwnedPageVisibilityMock,
}));

vi.mock("@/service/onboarding/service", () => ({
  checkHandleAvailability: vi.fn(),
}));

import { togglePageVisibilityAction } from "@/app/[handle]/actions";

describe("togglePageVisibilityAction", () => {
  beforeEach(() => {
    headersMock.mockReset();
    getSessionMock.mockReset();
    toggleOwnedPageVisibilityMock.mockReset();

    headersMock.mockResolvedValue(new Headers());
  });

  test("미로그인 사용자는 토글할 수 없다", async () => {
    // Arrange
    getSessionMock.mockResolvedValueOnce(null);

    // Act
    const result = await togglePageVisibilityAction({
      handle: "@tester",
    });

    // Assert
    expect(result).toEqual({
      status: "error",
      message: "You need to sign in first.",
    });
    expect(toggleOwnedPageVisibilityMock).not.toHaveBeenCalled();
  });

  test("handle 형식이 올바르지 않으면 검증 에러를 반환한다", async () => {
    // Arrange
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "user-1",
      },
    });

    // Act
    const result = await togglePageVisibilityAction({
      handle: "invalid-handle",
    });

    // Assert
    expect(result).toEqual({
      status: "error",
      message: "Invalid page handle.",
    });
    expect(toggleOwnedPageVisibilityMock).not.toHaveBeenCalled();
  });

  test("소유자 페이지면 공개 상태를 토글하고 저장 시각을 반환한다", async () => {
    // Arrange
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "user-1",
      },
    });
    toggleOwnedPageVisibilityMock.mockResolvedValueOnce({
      isPublic: false,
      updatedAt: "2026-02-12T12:00:00.000Z",
    });

    // Act
    const result = await togglePageVisibilityAction({
      handle: "@tester",
    });

    // Assert
    expect(toggleOwnedPageVisibilityMock).toHaveBeenCalledWith({
      storedHandle: "@tester",
      userId: "user-1",
    });
    expect(result).toEqual({
      status: "success",
      isPublic: false,
      savedAt: "2026-02-12T12:00:00.000Z",
    });
  });

  test("소유권이 없으면 권한 에러를 반환한다", async () => {
    // Arrange
    getSessionMock.mockResolvedValueOnce({
      user: {
        id: "user-2",
      },
    });
    toggleOwnedPageVisibilityMock.mockResolvedValueOnce(null);

    // Act
    const result = await togglePageVisibilityAction({
      handle: "@tester",
    });

    // Assert
    expect(result).toEqual({
      status: "error",
      message: "You do not have permission to update this page.",
    });
  });
});
