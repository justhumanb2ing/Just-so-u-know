import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

describe("Dialog", () => {
  test("백드롭/뷰포트/팝업은 data-no-dnd 속성으로 DnD 전파를 차단한다", () => {
    // Arrange
    render(
      <Dialog open onOpenChange={() => {}}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );

    // Act
    const backdrop = document.querySelector('[data-slot="dialog-backdrop"]');
    const viewport = document.querySelector('[data-slot="dialog-viewport"]');
    const popup = document.querySelector('[data-slot="dialog-popup"]');

    // Assert
    expect(backdrop?.getAttribute("data-no-dnd")).toBe("true");
    expect(viewport?.getAttribute("data-no-dnd")).toBe("true");
    expect(popup?.getAttribute("data-no-dnd")).toBe("true");
  });
});
