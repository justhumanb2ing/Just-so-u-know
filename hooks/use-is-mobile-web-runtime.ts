import { useEffect, useState } from "react";
import { isMobileWebUserAgent } from "@/lib/mobile-web-runtime";

export { isMobileWebUserAgent } from "@/lib/mobile-web-runtime";

/**
 * SSR과 클라이언트 첫 렌더를 동일하게 맞춘 뒤, 마운트 후 User Agent로 모바일 런타임 여부를 갱신한다.
 */
export function useIsMobileWebRuntime() {
  const [isMobileWebRuntime, setIsMobileWebRuntime] = useState(false);

  useEffect(() => {
    const nextIsMobileWebRuntime = isMobileWebUserAgent(navigator.userAgent ?? "");
    setIsMobileWebRuntime((prevIsMobileWebRuntime) =>
      prevIsMobileWebRuntime === nextIsMobileWebRuntime ? prevIsMobileWebRuntime : nextIsMobileWebRuntime,
    );
  }, []);

  return isMobileWebRuntime;
}
