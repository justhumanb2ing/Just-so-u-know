import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { SocialAccountsSheet } from "@/components/public-page/social-accounts-sheet";

vi.mock("@/components/public-page/editable-social-accounts-section", () => ({
  EditableSocialAccountsSection: ({ onSaveSuccess }: { onSaveSuccess?: () => void }) => (
    <button
      type="button"
      onClick={() => {
        onSaveSuccess?.();
      }}
    >
      Mock Save Success
    </button>
  ),
}));

describe("SocialAccountsSheet", () => {
  test("소셜 저장 성공 콜백이 호출되면 Drawer를 닫는다", () => {
    // Arrange
    const onOpenChange = vi.fn();

    // Act
    render(<SocialAccountsSheet contentId="social-sheet" handle="@tester" initialItems={[]} open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Mock Save Success" }));

    // Assert
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
