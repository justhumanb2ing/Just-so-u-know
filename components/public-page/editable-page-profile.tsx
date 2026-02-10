"use client";

import { CircleFadingArrowUpIcon, LoaderIcon, TrashIcon } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { savePageProfileAction } from "@/app/[handle]/actions";
import {
  PUBLIC_PAGE_BIO_CLASSNAME,
  PUBLIC_PAGE_FIELD_BASE_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME,
  PUBLIC_PAGE_IMAGE_EDIT_GROUP_CLASSNAME,
  PUBLIC_PAGE_IMAGE_EDIT_TRIGGER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_LOADING_OVERLAY_CLASSNAME,
  PUBLIC_PAGE_IMAGE_PLACEHOLDER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_REMOVE_BUTTON_CLASSNAME,
  PUBLIC_PAGE_NAME_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toastManager } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  isAllowedPageImageFileSize,
  isAllowedPageImageMimeType,
  PAGE_IMAGE_FILE_NAME,
  PAGE_IMAGE_MAX_FILE_SIZE_BYTES,
  PAGE_IMAGE_OUTPUT_MIME_TYPE,
} from "@/service/onboarding/page-image";

const SAVE_DEBOUNCE_MS = 400;
const LINE_BREAK_PATTERN = /[\r\n]+/g;
const IMAGE_MAX_SIZE_MB = Math.floor(PAGE_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024));
const IMAGE_ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";
const IMAGE_COMPRESSION_QUALITY = 0.98;
const IMAGE_MAX_WIDTH_OR_HEIGHT = 2048;

type EditablePageProfileProps = {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
  initialImage: string | null;
};

type DraftState = {
  name: string;
  bio: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

type ApiErrorResponse = {
  status: "error";
  message: string;
};

type InitImageUploadResponse = {
  status: "success";
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
};

type CompleteImageUploadResponse = {
  status: "success" | "partial_success";
  imageUrl: string;
  message?: string;
};

type DeleteImageResponse = {
  status: "success" | "partial_success";
  message?: string;
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

async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse | null> {
  try {
    return (await response.json()) as TResponse;
  } catch {
    return null;
  }
}

/**
 * 공개 페이지의 name/bio를 Enter 또는 디바운스로 저장하고, 이미지 업로드/삭제를 처리한다.
 */
export function EditablePageProfile({ handle, initialName, initialBio, initialImage }: EditablePageProfileProps) {
  const [name, setName] = useState(initialName ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
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

  /**
   * 선택한 이미지를 정책에 맞게 WebP(320x320)로 압축하고 업로드 완료까지 수행한다.
   */
  const uploadImage = useCallback(
    async (file: File) => {
      if (!isAllowedPageImageMimeType(file.type)) {
        toastManager.add({
          type: "error",
          title: "Unsupported image format",
          description: "Please upload a JPG, PNG, or WebP image.",
        });
        return;
      }

      if (!isAllowedPageImageFileSize(file.size)) {
        toastManager.add({
          type: "error",
          title: "Image is too large",
          description: `Please upload an image up to ${IMAGE_MAX_SIZE_MB}MB.`,
        });
        return;
      }

      setIsUploadingImage(true);

      try {
        const { default: imageCompression } = await import("browser-image-compression");
        const compressedImage = await imageCompression(file, {
          useWebWorker: true,
          maxWidthOrHeight: IMAGE_MAX_WIDTH_OR_HEIGHT,
          fileType: PAGE_IMAGE_OUTPUT_MIME_TYPE,
          initialQuality: IMAGE_COMPRESSION_QUALITY,
          alwaysKeepResolution: true,
        });
        const outputFile = new File([compressedImage], PAGE_IMAGE_FILE_NAME, {
          type: PAGE_IMAGE_OUTPUT_MIME_TYPE,
        });

        const initResponse = await fetch("/api/page/image/init-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ handle }),
        });
        const initPayload = await parseJsonResponse<InitImageUploadResponse | ApiErrorResponse>(initResponse);

        if (!initResponse.ok || !initPayload || initPayload.status !== "success") {
          throw new Error(initPayload?.status === "error" ? initPayload.message : "Failed to initialize image upload.");
        }

        const uploadResponse = await fetch(initPayload.uploadUrl, {
          method: "PUT",
          headers: initPayload.uploadHeaders,
          body: outputFile,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image.");
        }

        const completeResponse = await fetch("/api/page/image/complete-upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ handle }),
        });
        const completePayload = await parseJsonResponse<CompleteImageUploadResponse | ApiErrorResponse>(completeResponse);

        if (!completeResponse.ok || !completePayload || completePayload.status === "error" || !("imageUrl" in completePayload)) {
          throw new Error(completePayload?.status === "error" ? completePayload.message : "Failed to complete image upload.");
        }

        setImageUrl(completePayload.imageUrl);

        if (completePayload.status === "partial_success") {
          toastManager.add({
            type: "error",
            title: "Image updated with errors",
            description: completePayload.message ?? "Previous image cleanup failed.",
          });
        }
      } catch (error) {
        toastManager.add({
          type: "error",
          title: "Failed to upload image",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setIsUploadingImage(false);
      }
    },
    [handle],
  );

  const handleImageInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile || isUploadingImage || isDeletingImage) {
        event.target.value = "";
        return;
      }

      await uploadImage(selectedFile);
      event.target.value = "";
    },
    [isDeletingImage, isUploadingImage, uploadImage],
  );

  const handleImageSelectClick = useCallback(() => {
    if (isUploadingImage || isDeletingImage) {
      return;
    }

    imageInputRef.current?.click();
  }, [isDeletingImage, isUploadingImage]);

  /**
   * DB image null 처리 후 Storage object 삭제를 요청한다.
   */
  const handleDeleteImage = useCallback(async () => {
    if (isUploadingImage || isDeletingImage) {
      return;
    }

    setIsDeletingImage(true);

    try {
      const response = await fetch("/api/page/image/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ handle }),
      });
      const payload = await parseJsonResponse<DeleteImageResponse | ApiErrorResponse>(response);

      if (!response.ok || !payload || payload.status === "error") {
        throw new Error(payload?.status === "error" ? payload.message : "Failed to delete image.");
      }

      setImageUrl(null);

      if (payload.status === "partial_success") {
        toastManager.add({
          type: "error",
          title: "Image removed with errors",
          description: payload.message ?? "Storage cleanup failed.",
        });
      }
    } catch (error) {
      toastManager.add({
        type: "error",
        title: "Failed to delete image",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsDeletingImage(false);
    }
  }, [handle, isDeletingImage, isUploadingImage]);

  return (
    <div className={PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME}>
      <section className="flex items-center gap-3">
        <div className={PUBLIC_PAGE_IMAGE_EDIT_GROUP_CLASSNAME}>
          <input
            ref={imageInputRef}
            type="file"
            accept={IMAGE_ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={(event) => {
              void handleImageInputChange(event);
            }}
          />
          <button
            type="button"
            onClick={handleImageSelectClick}
            disabled={isUploadingImage || isDeletingImage}
            className={PUBLIC_PAGE_IMAGE_EDIT_TRIGGER_CLASSNAME}
            aria-label={imageUrl ? "Change profile image" : "Upload profile image"}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Profile"
                fill
                sizes="(min-width: 768px) 176px, 120px"
                quality={95}
                unoptimized
                className={PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME}
              />
            ) : (
              <span className={PUBLIC_PAGE_IMAGE_PLACEHOLDER_CLASSNAME}>
                <CircleFadingArrowUpIcon className="size-6" strokeWidth="3" />
                <span className="font-semibold">Add Avatar</span>
              </span>
            )}
            {isUploadingImage || isDeletingImage ? (
              <div className={PUBLIC_PAGE_IMAGE_LOADING_OVERLAY_CLASSNAME}>
                <LoaderIcon className="size-5 animate-spin text-white" />
              </div>
            ) : null}
          </button>
          {imageUrl ? (
            <Button
              type="button"
              size="icon-lg"
              className={PUBLIC_PAGE_IMAGE_REMOVE_BUTTON_CLASSNAME}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void handleDeleteImage();
              }}
              disabled={isUploadingImage || isDeletingImage}
            >
              <TrashIcon className="size-4" strokeWidth={3} />
            </Button>
          ) : null}
        </div>
      </section>
      <section className="flex flex-col gap-3">
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
      </section>
    </div>
  );
}
