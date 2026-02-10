type SignInCTAState = {
  action: "sign-in";
  label: "Sign in";
  href: "/sign-in";
  nativeButton: false;
};

type SignOutCTAState = {
  action: "sign-out";
  label: "Sign out";
};

export type CTAButtonState = SignInCTAState | SignOutCTAState;

/**
 * 현재 세션 존재 여부를 기반으로 홈 CTA 버튼 상태를 결정한다.
 * 인증 전에는 로그인 진입, 인증 후에는 로그아웃 액션을 노출한다.
 */
export function resolveCTAButtonState(hasSession: boolean): CTAButtonState {
  if (hasSession) {
    return {
      action: "sign-out",
      label: "Sign out",
    };
  }

  return {
    action: "sign-in",
    label: "Sign in",
    href: "/sign-in",
    nativeButton: false,
  };
}
