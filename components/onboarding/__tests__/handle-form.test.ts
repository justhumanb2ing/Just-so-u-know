import { describe, expect, test } from "vitest";
import {
  resolveHandleAvailabilityOptions,
  resolveHandleCanSubmit,
  resolveHandleCheckErrorMessage,
  resolveHandleSubmitErrorMessage,
} from "@/components/onboarding/handle-form";

describe("resolveHandleSubmitErrorMessage", () => {
  test("제출 직후 입력값이 같으면 에러 메시지를 노출한다", () => {
    // Arrange
    const input = {
      submitErrorMessage: "This handle is already taken.",
      currentHandleInput: "tester",
      submittedHandleAtRequest: "tester",
    };

    // Act
    const result = resolveHandleSubmitErrorMessage(input);

    // Assert
    expect(result).toBe("This handle is already taken.");
  });

  test("에러 이후 입력값이 바뀌면 버튼 영역 복원을 위해 메시지를 숨긴다", () => {
    // Arrange
    const input = {
      submitErrorMessage: "This handle is already taken.",
      currentHandleInput: "tester2",
      submittedHandleAtRequest: "tester",
    };

    // Act
    const result = resolveHandleSubmitErrorMessage(input);

    // Assert
    expect(result).toBeNull();
  });

  test("에러 메시지가 없으면 항상 null을 반환한다", () => {
    // Arrange
    const input = {
      submitErrorMessage: undefined,
      currentHandleInput: "tester",
      submittedHandleAtRequest: "tester",
    };

    // Act
    const result = resolveHandleSubmitErrorMessage(input);

    // Assert
    expect(result).toBeNull();
  });
});

describe("resolveHandleCheckErrorMessage", () => {
  test("중복 체크에서 taken 상태면 에러 메시지를 반환한다", () => {
    // Arrange
    const input = {
      handleCheckState: {
        status: "taken" as const,
        message: "This handle is already taken.",
      },
    };

    // Act
    const result = resolveHandleCheckErrorMessage(input);

    // Assert
    expect(result).toBe("This handle is already taken.");
  });

  test("중복 체크에서 invalid 상태면 에러 메시지를 반환한다", () => {
    // Arrange
    const input = {
      handleCheckState: {
        status: "invalid" as const,
        message: "Handle must be at least 3 characters.",
      },
    };

    // Act
    const result = resolveHandleCheckErrorMessage(input);

    // Assert
    expect(result).toBe("Handle must be at least 3 characters.");
  });

  test("available 상태에서는 null을 반환한다", () => {
    // Arrange
    const input = {
      handleCheckState: {
        status: "available" as const,
        message: "This handle is available.",
        normalizedHandle: "tester",
      },
    };

    // Act
    const result = resolveHandleCheckErrorMessage(input);

    // Assert
    expect(result).toBeNull();
  });
});

describe("resolveHandleAvailabilityOptions", () => {
  test("update 모드에서는 @ 접두가 있어도 초기 입력/검증값을 동일한 핸들로 정규화한다", () => {
    // Arrange
    const input = {
      mode: "update" as const,
      initialHandle: "@TeSter_123",
    };

    // Act
    const result = resolveHandleAvailabilityOptions(input);

    // Assert
    expect(result).toEqual({
      initialHandleInput: "tester123",
      initialVerifiedHandle: "tester123",
    });
  });

  test("create 모드에서는 initialHandle이 있어도 항상 빈 입력으로 시작한다", () => {
    // Arrange
    const input = {
      mode: "create" as const,
      initialHandle: "tester",
    };

    // Act
    const result = resolveHandleAvailabilityOptions(input);

    // Assert
    expect(result).toEqual({
      initialHandleInput: "",
      initialVerifiedHandle: "",
    });
  });
});

describe("resolveHandleCanSubmit", () => {
  test("update 모드에서 입력값이 초기 handle과 같으면 비활성화한다", () => {
    // Arrange
    const input = {
      mode: "update" as const,
      initialHandle: "@tester",
      currentHandleInput: "tester",
      verifiedHandle: "tester",
      isSubmitting: false,
    };

    // Act
    const result = resolveHandleCanSubmit(input);

    // Assert
    expect(result).toBe(false);
  });

  test("update 모드에서 입력값이 변경되면 활성화한다", () => {
    // Arrange
    const input = {
      mode: "update" as const,
      initialHandle: "@tester",
      currentHandleInput: "tester2",
      verifiedHandle: "tester2",
      isSubmitting: false,
    };

    // Act
    const result = resolveHandleCanSubmit(input);

    // Assert
    expect(result).toBe(true);
  });

  test("create 모드는 초기 handle 비교 없이 verifiedHandle 기준으로 활성화한다", () => {
    // Arrange
    const input = {
      mode: "create" as const,
      initialHandle: "@tester",
      currentHandleInput: "tester",
      verifiedHandle: "tester",
      isSubmitting: false,
    };

    // Act
    const result = resolveHandleCanSubmit(input);

    // Assert
    expect(result).toBe(true);
  });
});
