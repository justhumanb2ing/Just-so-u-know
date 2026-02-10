export const ROLE_FIELD_VALUES = ["user", "admin"] as const;

export const AUTH_ADDITIONAL_FIELDS = {
  role: {
    type: [...ROLE_FIELD_VALUES],
    required: false,
    input: false,
    defaultValue: "user",
  },
  userMetadata: {
    type: "json" as const,
    required: false,
    input: false,
    defaultValue: { onboardingComplete: false },
  },
};
