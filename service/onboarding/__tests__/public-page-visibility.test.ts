import { beforeEach, describe, expect, test, vi } from "vitest";

const { executeMock, sqlTemplateCalls, kyselyMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  sqlTemplateCalls: [] as Array<{
    text: string;
    values: unknown[];
  }>,
  kyselyMock: {
    __testBrand: "kysely-mock",
  },
}));

vi.mock("kysely", () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => {
    sqlTemplateCalls.push({
      text: strings.join("__param__"),
      values,
    });

    return {
      execute: executeMock,
    };
  },
}));

vi.mock("@/lib/kysely", () => ({
  kysely: kyselyMock,
}));

import { toggleOwnedPageVisibility } from "@/service/onboarding/public-page";

describe("toggleOwnedPageVisibility", () => {
  beforeEach(() => {
    executeMock.mockReset();
    sqlTemplateCalls.length = 0;
  });

  test("소유한 페이지 공개 상태를 토글하고 최신 값을 반환한다", async () => {
    // Arrange
    const input = {
      storedHandle: "@tester",
      userId: "user-1",
    };
    const updatedRow = {
      isPublic: false,
      updatedAt: "2026-02-12T10:00:00.000Z",
    };
    executeMock.mockResolvedValueOnce({
      rows: [updatedRow],
    });

    // Act
    const result = await toggleOwnedPageVisibility(input);

    // Assert
    expect(result).toEqual(updatedRow);
    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(executeMock).toHaveBeenCalledWith(kyselyMock);
    expect(sqlTemplateCalls[0]?.text).toContain("is_public = not is_public");
    expect(sqlTemplateCalls[0]?.values).toEqual([input.storedHandle, input.userId]);
  });

  test("소유권 조건이 맞지 않으면 null을 반환한다", async () => {
    // Arrange
    executeMock.mockResolvedValueOnce({
      rows: [],
    });

    // Act
    const result = await toggleOwnedPageVisibility({
      storedHandle: "@tester",
      userId: "user-2",
    });

    // Assert
    expect(result).toBeNull();
  });
});
