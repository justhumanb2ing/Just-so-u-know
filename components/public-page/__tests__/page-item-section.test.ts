import { describe, expect, test, vi } from "vitest";
import { resolveSkippedItemEntryAnimationIds, shouldAllowCardDrag } from "@/components/public-page/page-item-section";

vi.mock("@/components/ui/map", () => ({
  Map: () => null,
}));

vi.mock("@/components/public-page/page-item-location-dialog", () => ({
  PageItemLocationDialog: () => null,
}));

describe("resolveSkippedItemEntryAnimationIds", () => {
  test("드래프트 저장 완료로 실제 아이템이 추가된 프레임에서는 진입 애니메이션을 스킵한다", () => {
    // Arrange
    const params = {
      previousItemIds: ["item-1"],
      nextItemIds: ["item-1", "item-2"],
      previousDraft: {
        exists: true,
        isSaving: true,
      },
      nextDraftExists: false,
    };

    // Act
    const result = resolveSkippedItemEntryAnimationIds(params);

    // Assert
    expect(result).toEqual(["item-2"]);
  });

  test("드래프트가 저장 중이 아니면 신규 아이템 진입 애니메이션을 유지한다", () => {
    // Arrange
    const params = {
      previousItemIds: ["item-1"],
      nextItemIds: ["item-1", "item-2"],
      previousDraft: {
        exists: true,
        isSaving: false,
      },
      nextDraftExists: false,
    };

    // Act
    const result = resolveSkippedItemEntryAnimationIds(params);

    // Assert
    expect(result).toEqual([]);
  });
});

describe("shouldAllowCardDrag", () => {
  test("data-no-dnd 컨테이너 내부 이벤트는 카드 드래그를 허용하지 않는다", () => {
    // Arrange
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-no-dnd", "true");
    const innerTarget = document.createElement("button");
    wrapper.append(innerTarget);
    document.body.append(wrapper);

    // Act
    const result = shouldAllowCardDrag(innerTarget);

    // Assert
    expect(result).toBe(false);
    wrapper.remove();
  });

  test("일반 요소 이벤트는 카드 드래그를 허용한다", () => {
    // Arrange
    const target = document.createElement("div");
    document.body.append(target);

    // Act
    const result = shouldAllowCardDrag(target);

    // Assert
    expect(result).toBe(true);
    target.remove();
  });
});
