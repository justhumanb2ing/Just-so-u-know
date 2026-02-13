import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { EditablePageOwnerSection } from "@/components/public-page/editable-page-owner-section";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

vi.mock("@/components/public-page/editable-page-content", () => ({
  EditablePageContent: ({ initialSocialItems }: { initialSocialItems: Array<{ platform: string; username: string }> }) => (
    <p data-testid="connected-social-values">
      {initialSocialItems.length > 0 ? initialSocialItems.map((item) => `${item.platform}:${item.username}`).join(",") : "empty"}
    </p>
  ),
}));

vi.mock("@/components/public-page/page-edit-floating-toolbar", () => ({
  OwnerActionFloatingToolbar: ({
    onSocialItemsChange,
  }: {
    onSocialItemsChange?: (items: Array<{ platform: string; username: string }>) => void;
  }) => (
    <button
      type="button"
      onClick={() => {
        onSocialItemsChange?.([]);
      }}
    >
      Delete Connected Socials
    </button>
  ),
}));

describe("EditablePageOwnerSection", () => {
  test("소셜 아이템 삭제가 툴바에서 반영되면 연결된 소셜 렌더도 즉시 동기화된다", () => {
    // Arrange
    render(
      <EditablePageOwnerSection
        handle="@tester"
        initialIsPublic
        initialName="Tester"
        initialBio={null}
        initialImage={null}
        initialItems={[]}
        initialSocialItems={[{ platform: "x", username: "tester" }]}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Delete Connected Socials" }));

    // Assert
    expect(screen.getByTestId("connected-social-values").textContent).toBe("empty");
  });
});
