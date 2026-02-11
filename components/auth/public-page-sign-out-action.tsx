import { SignOutButton } from "@/components/auth/sign-out-button";

type PublicPageSignOutActionProps = {
  hasSession: boolean;
  isOwnerPage: boolean;
};

/**
 * 공개 페이지에서 Sign out 버튼 노출 여부를 계산한다.
 */
export function shouldRenderPublicPageSignOutAction({ hasSession, isOwnerPage }: PublicPageSignOutActionProps) {
  return hasSession && isOwnerPage;
}

/**
 * 공개 페이지에서 Sign out CTA만 전담 렌더링한다.
 */
export function PublicPageSignOutAction({ hasSession, isOwnerPage }: PublicPageSignOutActionProps) {
  if (!shouldRenderPublicPageSignOutAction({ hasSession, isOwnerPage })) {
    return null;
  }

  return (
    <SignOutButton
      variant="link"
      label="Sign out"
      size="sm"
      className="h-9 rounded-full px-4 py-0 text-foreground"
      wrapperClassName="items-end"
    />
  );
}
