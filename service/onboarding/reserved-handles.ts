/**
 * 온보딩 handle로 사용할 수 없는 예약어 목록이다.
 */
export const RESERVED_HANDLES = [
  "about",
  "admin",
  "api",
  "app",
  "auth",
  "billing",
  "blog",
  "contact",
  "dashboard",
  "docs",
  "explore",
  "help",
  "home",
  "index",
  "login",
  "logout",
  "me",
  "new",
  "onboarding",
  "page",
  "pages",
  "pricing",
  "privacy",
  "root",
  "search",
  "settings",
  "signin",
  "signup",
  "static",
  "support",
  "terms",
  "user",
  "users",
  "www",
] as const;

const RESERVED_HANDLE_SET = new Set<string>(RESERVED_HANDLES);

/**
 * handle 예약어 여부를 반환한다.
 */
export function isReservedHandle(handle: string) {
  return RESERVED_HANDLE_SET.has(handle);
}
