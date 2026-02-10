"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { savePageProfileAction } from "@/app/[handle]/actions";
import {
  PUBLIC_PAGE_BIO_CLASSNAME,
  PUBLIC_PAGE_FIELD_BASE_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_NAME_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 400;
const LINE_BREAK_PATTERN = /[\r\n]+/g;

type EditablePageProfileProps = {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
};

type DraftState = {
  name: string;
  bio: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

function sanitizeSingleLineInput(value: string) {
  return value.replace(LINE_BREAK_PATTERN, " ");
}

function normalizeDraftForSave(draft: DraftState) {
  return {
    name: draft.name.trim(),
    bio: draft.bio.trim(),
  };
}

/**
 * 공개 페이지의 name/bio를 Enter 또는 디바운스로 저장하는 편집 컴포넌트다.
 */
export function EditablePageProfile({ handle, initialName, initialBio }: EditablePageProfileProps) {
  const [name, setName] = useState(initialName ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const latestDraftRef = useRef<DraftState>({
    name: initialName ?? "",
    bio: initialBio ?? "",
  });
  const savedDraftRef = useRef<DraftState>({
    name: initialName ?? "",
    bio: initialBio ?? "",
  });
  const latestRequestIdRef = useRef(0);

  /**
   * 서버 응답 순서를 보장하면서 최신 draft만 저장한다.
   */
  const persistDraft = useCallback(
    async (draft: DraftState) => {
      const draftToSave = normalizeDraftForSave(draft);
      const lastSavedDraft = normalizeDraftForSave(savedDraftRef.current);

      if (draftToSave.name === lastSavedDraft.name && draftToSave.bio === lastSavedDraft.bio) {
        return;
      }

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;
      setSaveStatus("saving");
      setErrorMessage("");

      const result = await savePageProfileAction({
        handle,
        name: draftToSave.name,
        bio: draftToSave.bio,
      });

      if (latestRequestIdRef.current !== requestId) {
        return;
      }

      if (result.status === "error") {
        setSaveStatus("error");
        setErrorMessage(result.message);
        return;
      }

      const normalizedSavedDraft = {
        name: result.name ?? "",
        bio: result.bio ?? "",
      };
      savedDraftRef.current = normalizedSavedDraft;

      const latestDraft = normalizeDraftForSave(latestDraftRef.current);
      if (latestDraft.name === draftToSave.name && latestDraft.bio === draftToSave.bio) {
        setName(normalizedSavedDraft.name);
        setBio(normalizedSavedDraft.bio);
        setSaveStatus("saved");
        return;
      }

      setSaveStatus("idle");
    },
    [handle],
  );

  useEffect(() => {
    latestDraftRef.current = { name, bio };
    const currentDraft = { name, bio };
    const timer = window.setTimeout(() => {
      void persistDraft(currentDraft);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [name, bio, persistDraft]);

  const handleEnterKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.nativeEvent.isComposing) {
        return;
      }

      event.preventDefault();
      void persistDraft({ name, bio });
    },
    [bio, name, persistDraft],
  );

  useEffect(() => {
    if (saveStatus !== "error") {
      return;
    }

    toastManager.add({
      type: "error",
      title: "Failed to save profile",
      description: errorMessage || "Please try again.",
    });
  }, [errorMessage, saveStatus]);

  return (
    <div className={PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME}>
      <Textarea
        value={name}
        placeholder={"Your name"}
        rows={1}
        onChange={(event) => setName(sanitizeSingleLineInput(event.target.value))}
        onKeyDown={handleEnterKeyDown}
        className={cn(PUBLIC_PAGE_FIELD_BASE_CLASSNAME, PUBLIC_PAGE_NAME_CLASSNAME)}
      />
      <Textarea
        value={bio}
        placeholder="Your bio"
        rows={2}
        maxLength={200}
        onChange={(event) => setBio(sanitizeSingleLineInput(event.target.value))}
        onKeyDown={handleEnterKeyDown}
        className={cn(PUBLIC_PAGE_FIELD_BASE_CLASSNAME, PUBLIC_PAGE_BIO_CLASSNAME)}
      />
    </div>
  );
}
