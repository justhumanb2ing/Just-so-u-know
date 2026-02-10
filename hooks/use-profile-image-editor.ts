"use client";

import type { ChangeEvent, RefObject } from "react";
import { useCallback, useRef, useState } from "react";
import { toastManager } from "@/components/ui/toast";
import {
  isAllowedPageImageFileSize,
  isAllowedPageImageMimeType,
  PAGE_IMAGE_FILE_NAME,
  PAGE_IMAGE_MAX_FILE_SIZE_BYTES,
  PAGE_IMAGE_OUTPUT_MIME_TYPE,
} from "@/service/onboarding/page-image";

const IMAGE_MAX_SIZE_MB = Math.floor(PAGE_IMAGE_MAX_FILE_SIZE_BYTES / (1024 * 1024));
const IMAGE_COMPRESSION_QUALITY = 0.98;
const IMAGE_MAX_WIDTH_OR_HEIGHT = 2048;

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

type UseProfileImageEditorParams = {
  handle: string;
  initialImage: string | null;
};

export type ProfileImageController = {
  imageUrl: string | null;
  isImageBusy: boolean;
  imageInputRef: RefObject<HTMLInputElement | null>;
  handleImageInputChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImageSelectClick: () => void;
  handleDeleteImage: () => Promise<void>;
};

async function parseJsonResponse<TResponse>(response: Response): Promise<TResponse | null> {
  try {
    return (await response.json()) as TResponse;
  } catch {
    return null;
  }
}

/**
 * 이미지 업로드/삭제와 busy 상태를 캡슐화한다.
 */
export function useProfileImageEditor({ handle, initialImage }: UseProfileImageEditorParams): ProfileImageController {
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isImageBusy = isUploadingImage || isDeletingImage;

  /**
   * 선택한 이미지를 정책에 맞게 WebP로 압축한 뒤 업로드 완료 API까지 처리한다.
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

      if (!selectedFile || isImageBusy) {
        event.target.value = "";
        return;
      }

      await uploadImage(selectedFile);
      event.target.value = "";
    },
    [isImageBusy, uploadImage],
  );

  const handleImageSelectClick = useCallback(() => {
    if (isImageBusy) {
      return;
    }

    imageInputRef.current?.click();
  }, [isImageBusy]);

  /**
   * DB image null 처리 후 Storage object 삭제를 요청한다.
   */
  const handleDeleteImage = useCallback(async () => {
    if (isImageBusy) {
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
  }, [handle, isImageBusy]);

  return {
    imageUrl,
    isImageBusy,
    imageInputRef,
    handleImageInputChange,
    handleImageSelectClick,
    handleDeleteImage,
  };
}
