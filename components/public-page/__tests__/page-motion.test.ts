import { describe, expect, it } from "vitest";
import {
  buildEditableSectionMotionConfig,
  buildItemEntryMotionConfig,
  resolveEditableSectionRevealDurationMs,
} from "@/components/public-page/page-motion";

describe("page motion", () => {
  it("편집 콘텐츠 섹션 애니메이션을 위에서 아래 순서로 구성한다", () => {
    // Arrange
    const shouldReduceMotion = false;

    // Act
    const result = buildEditableSectionMotionConfig(shouldReduceMotion);

    // Assert
    expect(result.profile.initial).toEqual({ opacity: 0, y: 20 });
    expect(result.social.initial).toEqual({ opacity: 0, y: 20 });
    expect(result.items.initial).toEqual({ opacity: 0, y: 20 });
    expect(result.profile.transition.duration).toBe(2.8);
    expect(result.social.transition.duration).toBe(2.8);
    expect(result.items.transition.duration).toBe(2.8);
    expect(result.profile.transition.delay).toBeLessThan(result.social.transition.delay);
    expect(result.social.transition.delay).toBeLessThan(result.items.transition.delay);
  });

  it("섹션 진입 모션이 모두 완료되는 시점을 ms로 계산한다", () => {
    // Arrange
    const shouldReduceMotion = false;
    const sectionMotion = buildEditableSectionMotionConfig(shouldReduceMotion);

    // Act
    const result = resolveEditableSectionRevealDurationMs(sectionMotion);

    // Assert
    expect(result).toBe(3520);
  });

  it("아이템 생성 진입 애니메이션은 완만한 속도로 노출된다", () => {
    // Arrange
    const shouldReduceMotion = false;

    // Act
    const itemMotion = buildItemEntryMotionConfig(shouldReduceMotion);

    // Assert
    expect(itemMotion.initial).toEqual({ opacity: 0, scale: 0.86 });
    expect(itemMotion.transition.duration).toBe(0.32);
  });

  it("reduced motion 환경에서는 진입 모션을 비활성화한다", () => {
    // Arrange
    const shouldReduceMotion = true;

    // Act
    const sectionMotion = buildEditableSectionMotionConfig(shouldReduceMotion);
    const itemMotion = buildItemEntryMotionConfig(shouldReduceMotion);

    // Assert
    expect(sectionMotion.profile.initial).toBe(false);
    expect(sectionMotion.social.initial).toBe(false);
    expect(sectionMotion.items.initial).toBe(false);
    expect(sectionMotion.profile.transition.duration).toBe(0);
    expect(itemMotion.initial).toBe(false);
    expect(itemMotion.transition.duration).toBe(0);
    expect(itemMotion.exit).toBeUndefined();
  });
});
