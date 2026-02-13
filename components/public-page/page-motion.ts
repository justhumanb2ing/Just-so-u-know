"use client";

const CONTENT_SECTION_EASE = [0.16, 1, 0.3, 1] as const;
const ITEM_ENTRY_EASE = [0.22, 1, 0.36, 1] as const;
const PROFILE_SECTION_DURATION = 2.8;
const SOCIAL_SECTION_DELAY = 0.36;
const ITEMS_SECTION_DELAY = 0.72;
const ITEM_COMPOSER_MAX_APPEAR_DELAY_MS = 320;

type SectionEntryState = {
  opacity: number;
  y?: number;
  scale?: number;
};

type SectionEntryMotion = {
  initial: SectionEntryState | false;
  animate: SectionEntryState;
  transition: {
    duration: number;
    delay: number;
    ease: typeof CONTENT_SECTION_EASE;
  };
};

export type EditableSectionMotionConfig = {
  profile: SectionEntryMotion;
  social: SectionEntryMotion;
  items: SectionEntryMotion;
};

export type ItemEntryMotionConfig = {
  initial: { opacity: number; scale: number } | false;
  animate: { opacity: number; scale: number };
  exit: { opacity: number; scale: number } | undefined;
  transition: {
    duration: number;
    ease: typeof ITEM_ENTRY_EASE;
  };
};

/**
 * 편집 섹션 3개(프로필/소셜/아이템) 중 마지막 모션이 끝나는 시점을 ms 단위로 계산한다.
 */
export function resolveEditableSectionRevealDurationMs(config: EditableSectionMotionConfig) {
  const lastRevealSecond = Math.max(
    config.profile.transition.delay + config.profile.transition.duration,
    config.social.transition.delay + config.social.transition.duration,
    config.items.transition.delay + config.items.transition.duration,
  );

  return Math.max(0, Math.round(lastRevealSecond * 1000));
}

/**
 * 하단 아이템 작성 바의 첫 노출 지연을 계산한다.
 * 마지막 섹션 애니메이션 완료까지 기다리지 않고, 체감 지연 상한을 둔다.
 */
export function resolveEditableItemComposerAppearDelayMs(config: EditableSectionMotionConfig) {
  const itemSectionDelayMs = Math.max(0, Math.round(config.items.transition.delay * 1000));

  return Math.min(itemSectionDelayMs, ITEM_COMPOSER_MAX_APPEAR_DELAY_MS);
}

/**
 * 접근성 설정(reduced motion)에 따라 섹션 진입 애니메이션 구성을 결정한다.
 */
export function buildEditableSectionMotionConfig(shouldReduceMotion: boolean): EditableSectionMotionConfig {
  if (shouldReduceMotion) {
    const noMotionTransition = {
      duration: 0,
      delay: 0,
      ease: CONTENT_SECTION_EASE,
    } as const;

    return {
      profile: {
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: noMotionTransition,
      },
      social: {
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: noMotionTransition,
      },
      items: {
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: noMotionTransition,
      },
    };
  }

  return {
    profile: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: PROFILE_SECTION_DURATION,
        delay: 0,
        ease: CONTENT_SECTION_EASE,
      },
    },
    social: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: PROFILE_SECTION_DURATION,
        delay: SOCIAL_SECTION_DELAY,
        ease: CONTENT_SECTION_EASE,
      },
    },
    items: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: PROFILE_SECTION_DURATION,
        delay: ITEMS_SECTION_DELAY,
        ease: CONTENT_SECTION_EASE,
      },
    },
  };
}

/**
 * 아이템 생성/삭제 시 시각 피드백을 위한 진입/이탈 애니메이션 구성을 반환한다.
 */
export function buildItemEntryMotionConfig(shouldReduceMotion: boolean): ItemEntryMotionConfig {
  if (shouldReduceMotion) {
    return {
      initial: false,
      animate: { opacity: 1, scale: 1 },
      exit: undefined,
      transition: {
        duration: 0,
        ease: ITEM_ENTRY_EASE,
      },
    };
  }

  return {
    initial: { opacity: 0, scale: 0.86 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: {
      duration: 0.32,
      ease: ITEM_ENTRY_EASE,
    },
  };
}
