"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { type ChangePageHandleActionState, changePageHandleAction } from "@/app/[handle]/actions";
import { HandleForm } from "@/components/onboarding/handle-form";
import { trackFeatureUse } from "@/service/analytics/tracker";

const INITIAL_CHANGE_PAGE_HANDLE_STATE: ChangePageHandleActionState = {
  status: "idle",
};

type EditablePageHandleFormProps = {
  handle: string;
};

type ResolveShouldTrackHandleUpdateFeatureInput = {
  previousStoredHandle: string;
  nextStoredHandle: string;
};

/**
 * 핸들 변경 성공 결과가 실제 값 변경인지 판단한다.
 * 동일 handle 재제출(no-op) 성공은 분석 이벤트를 기록하지 않는다.
 */
export function resolveShouldTrackHandleUpdateFeature({
  previousStoredHandle,
  nextStoredHandle,
}: ResolveShouldTrackHandleUpdateFeatureInput) {
  return previousStoredHandle !== nextStoredHandle;
}

/**
 * 공개 페이지 편집 화면에서 핸들 변경 제출을 담당한다.
 */
export function EditablePageHandleForm({ handle }: EditablePageHandleFormProps) {
  const router = useRouter();
  const [actionState, formAction, isSubmitting] = useActionState(changePageHandleAction, INITIAL_CHANGE_PAGE_HANDLE_STATE);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    if (
      resolveShouldTrackHandleUpdateFeature({
        previousStoredHandle: handle,
        nextStoredHandle: actionState.storedHandle,
      })
    ) {
      trackFeatureUse({
        featureName: "page_handle_update",
        actorType: "owner",
        context: {
          previous_handle: handle,
          next_handle: actionState.storedHandle,
        },
      });
    }

    router.replace(actionState.publicPath);
  }, [actionState, handle, router]);

  return (
    <HandleForm
      mode="update"
      formAction={formAction}
      isSubmitting={isSubmitting}
      submitErrorMessage={actionState.status === "error" ? actionState.message : undefined}
      initialHandle={handle}
      hiddenFields={[{ name: "storedHandle", value: handle }]}
    />
  );
}
