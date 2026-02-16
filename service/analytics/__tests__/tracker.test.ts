import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { trackFeatureUse, trackPageView, trackProfileView, trackSignupComplete } from "@/service/analytics/tracker";

describe("analytics tracker", () => {
  beforeEach(() => {
    window.umami = {
      track: vi.fn(),
      identify: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("profile_view 이벤트에 schema_version을 포함한다", () => {
    // Arrange
    const umamiTrack = vi.mocked(window.umami?.track);

    // Act
    trackProfileView({
      pageId: "page-1",
      isOwner: false,
      isPublic: true,
      entryPath: "/@tester",
    });

    // Assert
    expect(umamiTrack).toHaveBeenCalledWith(
      "profile_view",
      expect.objectContaining({
        page_id: "page-1",
        is_owner: false,
        is_public: true,
        entry_path: "/@tester",
        schema_version: "v1",
      }),
    );
  });

  test("tracker가 늦게 로드되면 재시도 후 pageview를 전송한다", () => {
    // Arrange
    vi.useFakeTimers();
    const track = vi.fn();
    delete window.umami;

    // Act
    trackPageView();
    vi.advanceTimersByTime(120);
    window.umami = {
      track,
      identify: vi.fn(),
    };
    vi.advanceTimersByTime(120);

    // Assert
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith();
  });

  test("signup_complete 이벤트에 user_id와 created_page_id를 포함한다", () => {
    // Arrange
    const umamiTrack = vi.mocked(window.umami?.track);

    // Act
    trackSignupComplete({
      userId: "user-1",
      createdPageId: "page-99",
      source: "onboarding",
      provider: "google",
    });

    // Assert
    expect(umamiTrack).toHaveBeenCalledWith(
      "signup_complete",
      expect.objectContaining({
        user_id: "user-1",
        created_page_id: "page-99",
        source: "onboarding",
        provider: "google",
        schema_version: "v1",
      }),
    );
  });

  test("feature_use 이벤트에 feature_name/actor_type/context를 포함한다", () => {
    // Arrange
    const umamiTrack = vi.mocked(window.umami?.track);

    // Act
    trackFeatureUse({
      featureName: "page_visibility_toggle",
      actorType: "owner",
      context: {
        handle: "@tester",
        target_visibility: "public",
      },
    });

    // Assert
    expect(umamiTrack).toHaveBeenCalledWith(
      "feature_use",
      expect.objectContaining({
        feature_name: "page_visibility_toggle",
        actor_type: "owner",
        context: {
          handle: "@tester",
          target_visibility: "public",
        },
        schema_version: "v1",
      }),
    );
  });
});
