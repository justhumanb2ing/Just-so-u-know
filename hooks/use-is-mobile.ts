import { useMediaQuery } from "./use-media-query";

const MOBILE_BREAKPOINT = 767;

/**
 * SSR과 클라이언트 첫 렌더를 동일하게 맞춰 hydration mismatch를 방지한다.
 * 실제 viewport 판별은 마운트 이후 media query 구독 결과로 갱신된다.
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  return useMediaQuery(`(max-width: ${breakpoint ?? MOBILE_BREAKPOINT - 1}px)`, {
    defaultValue: false,
    initializeWithValue: false,
  });
}
