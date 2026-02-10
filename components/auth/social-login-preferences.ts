import { SOCIAL_PROVIDER_OPTIONS, type SocialProviderOption } from "@/components/auth/social-provider-options";

const LOGIN_METHOD_LABELS: Record<string, string> = SOCIAL_PROVIDER_OPTIONS.reduce<Record<string, string>>((acc, option) => {
  acc[option.provider] = option.label;
  return acc;
}, {});

LOGIN_METHOD_LABELS.email = "이메일";
LOGIN_METHOD_LABELS["email-password"] = "이메일";

export function getLoginMethodLabel(method: string | null | undefined) {
  if (!method) {
    return null;
  }

  return LOGIN_METHOD_LABELS[method] ?? method;
}

export function prioritizeSocialOptions(
  method: string | null | undefined,
  options: readonly SocialProviderOption[] = SOCIAL_PROVIDER_OPTIONS,
) {
  if (!method) {
    return options;
  }

  const providerIndex = options.findIndex((option) => option.provider === method);
  if (providerIndex <= 0) {
    return options;
  }

  const orderedOptions = [...options];
  const [preferredOption] = orderedOptions.splice(providerIndex, 1);
  orderedOptions.unshift(preferredOption);

  return orderedOptions;
}
