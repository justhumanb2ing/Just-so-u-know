"use client";

import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { savePageProfileAction } from "@/app/[handle]/actions";
import { toastManager } from "@/components/ui/toast";

const SAVE_DEBOUNCE_MS = 400;
const LINE_BREAK_PATTERN = /[\r\n]+/g;

type DraftState = {
  name: string;
  bio: string;
};

type UseProfileDraftParams = {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
};

export type ProfileDraftController = {
  name: string;
  bio: string;
  handleNameChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleBioChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleEnterKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
};

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
 * 입력 draft를 디바운스/엔터 기준으로 저장하고 응답 순서를 보장한다.
 */
export function useProfileDraft({ handle, initialName, initialBio }: UseProfileDraftParams): ProfileDraftController {
  const [name, setName] = useState(initialName ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const latestDraftRef = useRef<DraftState>({
    name: initialName ?? "",
    bio: initialBio ?? "",
  });
  const savedDraftRef = useRef<DraftState>({
    name: initialName ?? "",
    bio: initialBio ?? "",
  });
  const latestRequestIdRef = useRef(0);

  const persistDraft = useCallback(
    async (draft: DraftState) => {
      const draftToSave = normalizeDraftForSave(draft);
      const lastSavedDraft = normalizeDraftForSave(savedDraftRef.current);

      if (draftToSave.name === lastSavedDraft.name && draftToSave.bio === lastSavedDraft.bio) {
        return;
      }

      const requestId = latestRequestIdRef.current + 1;
      latestRequestIdRef.current = requestId;

      const result = await savePageProfileAction({
        handle,
        name: draftToSave.name,
        bio: draftToSave.bio,
      });

      if (latestRequestIdRef.current !== requestId) {
        return;
      }

      if (result.status === "error") {
        toastManager.add({
          type: "error",
          title: "Failed to save profile",
          description: result.message || "Please try again.",
        });
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
      }
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

  const handleNameChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setName(sanitizeSingleLineInput(event.target.value));
  }, []);

  const handleBioChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setBio(sanitizeSingleLineInput(event.target.value));
  }, []);

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

  return {
    name,
    bio,
    handleNameChange,
    handleBioChange,
    handleEnterKeyDown,
  };
}
