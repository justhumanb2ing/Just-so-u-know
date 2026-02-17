import { ANALYTICS_SCHEMA_VERSION } from "@/config/analytics/umami";
import { ANALYTICS_EVENT_NAMES, type CtaPlacement, type FeatureActorType, type SignupSource } from "@/service/analytics/schema";

const TRACKER_RETRY_DELAY_MS = 120;
const TRACKER_RETRY_MAX_ATTEMPTS = 20;

type AnalyticsPayload = Record<string, unknown>;

function resolveUmamiTracker() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.umami ?? null;
}

/**
 * hydration 직후 tracker 로딩 지연이 있어도 이벤트 유실을 줄이기 위해 짧게 재시도한다.
 */
function runWhenTrackerReady(callback: (tracker: NonNullable<Window["umami"]>) => void, attempt = 0) {
  const tracker = resolveUmamiTracker();

  if (tracker) {
    callback(tracker);
    return;
  }

  if (attempt >= TRACKER_RETRY_MAX_ATTEMPTS || typeof window === "undefined") {
    return;
  }

  window.setTimeout(() => {
    runWhenTrackerReady(callback, attempt + 1);
  }, TRACKER_RETRY_DELAY_MS);
}

function withSchemaVersion(payload: AnalyticsPayload) {
  return {
    ...payload,
    schema_version: ANALYTICS_SCHEMA_VERSION,
  };
}

/**
 * handle 변경에 영향받지 않도록 page_id 기반 canonical URL을 구성한다.
 */
function resolvePageTrackingUrl(pageId: string) {
  return `/page/${pageId}`;
}

export function trackPageView() {
  runWhenTrackerReady((tracker) => {
    tracker.track();
  });
}

export function trackEvent(name: string, payload: AnalyticsPayload = {}, options?: { pageId?: string }) {
  runWhenTrackerReady((tracker) => {
    const eventPayload = withSchemaVersion(payload);
    const pageId = options?.pageId;

    if (pageId) {
      tracker.track((props) => ({
        ...props,
        url: resolvePageTrackingUrl(pageId),
        name,
        data: eventPayload,
      }));
      return;
    }

    tracker.track(name, eventPayload);
  });
}

export function trackProfileView(input: { pageId: string; isOwner: boolean; isPublic: boolean; entryPath?: string }) {
  trackEvent(
    ANALYTICS_EVENT_NAMES.profileView,
    {
      page_id: input.pageId,
      is_owner: input.isOwner,
      is_public: input.isPublic,
      entry_path: input.entryPath,
    },
    {
      pageId: input.pageId,
    },
  );
}

export function trackAuthSignInClick(input: { pageId: string; placement: CtaPlacement; returnTo?: string }) {
  trackEvent(
    ANALYTICS_EVENT_NAMES.authSignInClick,
    {
      page_id: input.pageId,
      placement: input.placement,
      return_to: input.returnTo,
    },
    {
      pageId: input.pageId,
    },
  );
}

export function trackAuthMyPageClick(input: { pageId: string; placement: CtaPlacement }) {
  trackEvent(
    ANALYTICS_EVENT_NAMES.authMyPageClick,
    {
      page_id: input.pageId,
      placement: input.placement,
    },
    {
      pageId: input.pageId,
    },
  );
}

export function trackAuthSocialLoginClick(input: { provider: string; callbackPath: string; entrySource: SignupSource }) {
  trackEvent(ANALYTICS_EVENT_NAMES.authSocialLoginClick, {
    provider: input.provider,
    callback_path: input.callbackPath,
    entry_source: input.entrySource,
  });
}

export function trackSignupStart(input: { source: SignupSource; provider: string; pageId?: string }) {
  trackEvent(
    ANALYTICS_EVENT_NAMES.signupStart,
    {
      source: input.source,
      provider: input.provider,
      page_id: input.pageId,
    },
    {
      pageId: input.pageId,
    },
  );
}

export function trackSignupComplete(input: { userId: string; createdPageId: string; source: string; provider?: string }) {
  trackEvent(ANALYTICS_EVENT_NAMES.signupComplete, {
    user_id: input.userId,
    created_page_id: input.createdPageId,
    source: input.source,
    provider: input.provider,
  });
}

/**
 * 기능 사용 이벤트를 공통 포맷으로 전송한다.
 * 성공 기준이 있는 액션에서만 호출해 실제 사용량 지표로 활용한다.
 */
export function trackFeatureUse(input: {
  featureName: string;
  actorType: FeatureActorType;
  pageId?: string;
  context?: Record<string, unknown>;
}) {
  trackEvent(
    ANALYTICS_EVENT_NAMES.featureUse,
    {
      feature_name: input.featureName,
      actor_type: input.actorType,
      page_id: input.pageId,
      context: input.context,
    },
    {
      pageId: input.pageId,
    },
  );
}

export function identifySession(input: { distinctId?: string; userId?: string; role?: "guest" | "member" }) {
  runWhenTrackerReady((tracker) => {
    const data = withSchemaVersion({
      user_id: input.userId,
      role: input.role,
    });

    if (input.distinctId) {
      tracker.identify(input.distinctId, data);
      return;
    }

    tracker.identify(data);
  });
}
