import { fireEvent, render } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EditablePageProfile, shouldRejectProfileImageFile } from "@/components/public-page/editable-page-profile";

const mockToastError = vi.fn();
const mockHandleImageInputChange = vi.fn(async () => {});

vi.mock("motion/react", () => ({
  motion: {
    button: ({
      children,
      whileTap: _whileTap,
      transition: _transition,
      ...props
    }: {
      children?: ReactNode;
      whileTap?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }) => <button {...(props as ComponentProps<"button">)}>{children}</button>,
  },
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock("@/hooks/use-profile-draft", () => ({
  useProfileDraft: () => ({
    name: "",
    bio: "",
    handleNameChange: vi.fn(),
    handleBioChange: vi.fn(),
    handleEnterKeyDown: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-profile-image-editor", () => ({
  useProfileImageEditor: () => ({
    imageUrl: null,
    isImageBusy: false,
    imageInputRef: { current: null },
    handleImageInputChange: mockHandleImageInputChange,
    handleImageSelectClick: vi.fn(),
    handleDeleteImage: vi.fn(),
  }),
}));

describe("EditablePageProfile image upload", () => {
  beforeEach(() => {
    mockToastError.mockClear();
    mockHandleImageInputChange.mockClear();
  });

  test("비허용 타입 파일 선택 시 즉시 토스트를 띄우고 업로드를 중단한다", () => {
    // Arrange
    const { container } = render(<EditablePageProfile handle="tester" initialName={null} initialBio={null} initialImage={null} />);
    const input = container.querySelector('input[type="file"]');
    const unsupportedFile = new File(["gif"], "avatar.gif", { type: "image/gif" });

    if (!input) {
      throw new Error("file input not found");
    }

    // Act
    fireEvent.change(input, { target: { files: [unsupportedFile] } });

    // Assert
    expect(mockToastError).toHaveBeenCalledWith("Unsupported image format", {
      description: "Please upload a JPG, PNG, or WebP image.",
    });
    expect(mockHandleImageInputChange).not.toHaveBeenCalled();
  });

  test("허용 타입 파일 선택 시 업로드 핸들러를 호출한다", () => {
    // Arrange
    const { container } = render(<EditablePageProfile handle="tester" initialName={null} initialBio={null} initialImage={null} />);
    const input = container.querySelector('input[type="file"]');
    const supportedFile = new File(["png"], "avatar.png", { type: "image/png" });

    if (!input) {
      throw new Error("file input not found");
    }

    // Act
    fireEvent.change(input, { target: { files: [supportedFile] } });

    // Assert
    expect(mockHandleImageInputChange).toHaveBeenCalledTimes(1);
    expect(mockToastError).not.toHaveBeenCalled();
  });
});

describe("shouldRejectProfileImageFile", () => {
  test("파일이 없으면 false를 반환한다", () => {
    // Arrange
    const selectedFile = null;

    // Act
    const result = shouldRejectProfileImageFile(selectedFile);

    // Assert
    expect(result).toBe(false);
  });
});
