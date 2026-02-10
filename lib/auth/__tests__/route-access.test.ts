import { describe, expect, test } from "vitest";

import {
  isOnboardingComplete,
  resolveAuthProxyRedirectPath,
  resolveMeRedirectPath,
  resolveReturnPathFromReferer,
} from "@/lib/auth/route-access";

describe("route-access", () => {
  test("같은 origin referer는 return path로 사용한다", () => {
    // Arrange
    const referer = "https://app.example.com/dashboard?tab=home";
    const currentOrigin = "https://app.example.com";

    // Act
    const returnPath = resolveReturnPathFromReferer(referer, currentOrigin, "/");

    // Assert
    expect(returnPath).toBe("/dashboard?tab=home");
  });

  test("다른 origin referer는 fallback 경로를 사용한다", () => {
    // Arrange
    const referer = "https://evil.example/phishing";
    const currentOrigin = "https://app.example.com";

    // Act
    const returnPath = resolveReturnPathFromReferer(referer, currentOrigin, "/");

    // Assert
    expect(returnPath).toBe("/");
  });

  test("sign-in/onboarding referer는 루프 방지를 위해 fallback으로 보낸다", () => {
    // Arrange
    const signInReferer = "https://app.example.com/sign-in";
    const onboardingReferer = "https://app.example.com/onboarding";
    const currentOrigin = "https://app.example.com";

    // Act
    const signInReturnPath = resolveReturnPathFromReferer(signInReferer, currentOrigin, "/");
    const onboardingReturnPath = resolveReturnPathFromReferer(onboardingReferer, currentOrigin, "/");

    // Assert
    expect(signInReturnPath).toBe("/");
    expect(onboardingReturnPath).toBe("/");
  });

  test("onboardingComplete가 true일 때만 완료 상태로 판단한다", () => {
    // Arrange
    const completedMetadata = { onboardingComplete: true };
    const incompleteMetadata = { onboardingComplete: false };

    // Act
    const completed = isOnboardingComplete(completedMetadata);
    const incomplete = isOnboardingComplete(incompleteMetadata);

    // Assert
    expect(completed).toBe(true);
    expect(incomplete).toBe(false);
    expect(isOnboardingComplete(null)).toBe(false);
  });

  test("로그인 + 온보딩 미완료 사용자는 onboarding을 제외한 모든 페이지에서 onboarding으로 리다이렉트된다", () => {
    // Arrange
    const input = {
      pathname: "/",
      hasSessionCookie: true,
      hasSession: true,
      onboardingComplete: false,
      returnPath: "/",
    };

    // Act
    const redirectPath = resolveAuthProxyRedirectPath(input);

    // Assert
    expect(redirectPath).toBe("/onboarding");
  });

  test("로그인 + 온보딩 미완료 사용자의 onboarding 접근은 허용된다", () => {
    // Arrange
    const input = {
      pathname: "/onboarding",
      hasSessionCookie: true,
      hasSession: true,
      onboardingComplete: false,
      returnPath: "/",
    };

    // Act
    const redirectPath = resolveAuthProxyRedirectPath(input);

    // Assert
    expect(redirectPath).toBeNull();
  });

  test("비로그인 사용자의 onboarding 접근은 return path로 리다이렉트된다", () => {
    // Arrange
    const input = {
      pathname: "/onboarding",
      hasSessionCookie: false,
      hasSession: false,
      onboardingComplete: false,
      returnPath: "/",
    };

    // Act
    const redirectPath = resolveAuthProxyRedirectPath(input);

    // Assert
    expect(redirectPath).toBe("/");
  });

  test("로그인 + 온보딩 완료 사용자의 sign-in 접근은 return path로 리다이렉트된다", () => {
    // Arrange
    const input = {
      pathname: "/sign-in",
      hasSessionCookie: true,
      hasSession: true,
      onboardingComplete: true,
      returnPath: "/dashboard",
    };

    // Act
    const redirectPath = resolveAuthProxyRedirectPath(input);

    // Assert
    expect(redirectPath).toBe("/dashboard");
  });

  test("세션 쿠키가 있지만 세션이 유효하지 않은 경우 sign-in 페이지 접근은 허용된다", () => {
    // Arrange
    const input = {
      pathname: "/sign-in",
      hasSessionCookie: true,
      hasSession: false,
      onboardingComplete: false,
      returnPath: "/",
    };

    // Act
    const redirectPath = resolveAuthProxyRedirectPath(input);

    // Assert
    expect(redirectPath).toBeNull();
  });
});

describe("resolveMeRedirectPath", () => {
  test("세션이 없으면 sign-in 경로로 이동한다", () => {
    // Arrange
    const input = {
      hasSession: false,
      onboardingComplete: false,
      primaryPageHandle: null,
    };

    // Act
    const redirectPath = resolveMeRedirectPath(input);

    // Assert
    expect(redirectPath).toBe("/sign-in");
  });

  test("온보딩이 완료되지 않았으면 onboarding 경로로 이동한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      onboardingComplete: false,
      primaryPageHandle: "@owner",
    };

    // Act
    const redirectPath = resolveMeRedirectPath(input);

    // Assert
    expect(redirectPath).toBe("/onboarding");
  });

  test("로그인 + 온보딩 완료 + primary handle이 있으면 해당 공개 페이지로 이동한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      onboardingComplete: true,
      primaryPageHandle: "@owner",
    };

    // Act
    const redirectPath = resolveMeRedirectPath(input);

    // Assert
    expect(redirectPath).toBe("/@owner");
  });

  test("primary handle 형식이 잘못되었으면 onboarding 경로로 fallback 한다", () => {
    // Arrange
    const input = {
      hasSession: true,
      onboardingComplete: true,
      primaryPageHandle: "owner",
    };

    // Act
    const redirectPath = resolveMeRedirectPath(input);

    // Assert
    expect(redirectPath).toBe("/onboarding");
  });
});
