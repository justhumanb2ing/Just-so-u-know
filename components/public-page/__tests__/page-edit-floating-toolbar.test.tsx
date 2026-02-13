import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { OwnerActionFloatingToolbar } from "@/components/public-page/page-edit-floating-toolbar";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockDynamicComponent() {
      return null;
    },
}));

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: ({ label = "Sign out" }: { label?: string }) => (
    <button type="button" data-testid="mock-sign-out-button">
      {label}
    </button>
  ),
}));

vi.mock("@/components/auth/delete-account-button", () => ({
  DeleteAccountButton: () => (
    <button type="button" data-testid="mock-delete-account-button">
      Delete account
    </button>
  ),
}));

describe("OwnerActionFloatingToolbar", () => {
  test("account 트리거를 누르면 Popover 내부에 계정 액션 버튼들이 노출된다", () => {
    // Arrange
    render(<OwnerActionFloatingToolbar handle="@tester" initialIsPublic initialSocialItems={[]} />);

    // Act
    fireEvent.click(screen.getByRole("button", { name: "account" }));

    // Assert
    expect(screen.queryByTestId("mock-sign-out-button")).not.toBeNull();
    expect(screen.queryByTestId("mock-delete-account-button")).not.toBeNull();
  });
});
