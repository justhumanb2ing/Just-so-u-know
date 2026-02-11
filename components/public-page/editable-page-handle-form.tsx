"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { type ChangePageHandleActionState, changePageHandleAction } from "@/app/[handle]/actions";
import { HandleForm } from "@/components/onboarding/handle-form";

const INITIAL_CHANGE_PAGE_HANDLE_STATE: ChangePageHandleActionState = {
  status: "idle",
};

type EditablePageHandleFormProps = {
  storedHandle: string;
};

/**
 * 공개 페이지 편집 화면에서 핸들 변경 제출을 담당한다.
 */
export function EditablePageHandleForm({ storedHandle }: EditablePageHandleFormProps) {
  const router = useRouter();
  const [actionState, formAction, isSubmitting] = useActionState(changePageHandleAction, INITIAL_CHANGE_PAGE_HANDLE_STATE);

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    router.replace(actionState.publicPath);
  }, [actionState, router]);

  return (
    <HandleForm
      mode="update"
      formAction={formAction}
      isSubmitting={isSubmitting}
      submitErrorMessage={actionState.status === "error" ? actionState.message : undefined}
      hiddenFields={[{ name: "storedHandle", value: storedHandle }]}
    />
  );
}
