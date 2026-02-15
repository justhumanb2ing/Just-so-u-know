export const ACCOUNT_LINKING_TRUSTED_PROVIDERS = ["email-password", "google", "github", "kakao", "naver"] as const;

export type AccountLinkingTrustedProvider = (typeof ACCOUNT_LINKING_TRUSTED_PROVIDERS)[number];
export type SocialProvider = Exclude<AccountLinkingTrustedProvider, "email-password">;

export const SOCIAL_ACCOUNT_LINKING_PROVIDERS = ACCOUNT_LINKING_TRUSTED_PROVIDERS.filter(
  (provider): provider is SocialProvider => provider !== "email-password",
);

export const ACCOUNT_LINKING_CONFIG = {
  enabled: true,
  trustedProviders: [...ACCOUNT_LINKING_TRUSTED_PROVIDERS],
  allowDifferentEmails: false,
};
