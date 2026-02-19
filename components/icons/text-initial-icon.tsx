import type { ComponentProps } from "react";

/**
 * 섹션 타입 아이템 추가 버튼에서 사용하는 텍스트 이니셜 아이콘.
 */
export function TextInitialIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 6h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M12 6v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
