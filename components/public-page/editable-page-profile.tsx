"use client";

import { CircleFadingArrowUpIcon, LoaderIcon, TrashIcon } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import {
  PUBLIC_PAGE_BIO_FIELD_CLASSNAME,
  PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME,
  PUBLIC_PAGE_IMAGE_EDIT_GROUP_CLASSNAME,
  PUBLIC_PAGE_IMAGE_EDIT_TRIGGER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_LOADING_OVERLAY_CLASSNAME,
  PUBLIC_PAGE_IMAGE_PLACEHOLDER_CLASSNAME,
  PUBLIC_PAGE_IMAGE_REMOVE_BUTTON_CLASSNAME,
  PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE,
  PUBLIC_PAGE_NAME_FIELD_CLASSNAME,
  PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME,
} from "@/components/public-page/profile-field-styles";
import { buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileDraftController } from "@/hooks/use-profile-draft";
import { useProfileDraft } from "@/hooks/use-profile-draft";
import type { ProfileImageController } from "@/hooks/use-profile-image-editor";
import { useProfileImageEditor } from "@/hooks/use-profile-image-editor";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp";
const IMAGE_TRIGGER_TAP = { scale: 0.96 } as const;
const IMAGE_REMOVE_TAP = { scale: 0.92 } as const;
const IMAGE_BUTTON_TRANSITION = {
  duration: 0.12,
  ease: "easeOut",
} as const;

type EditablePageProfileProps = {
  handle: string;
  initialName: string | null;
  initialBio: string | null;
  initialImage: string | null;
};

type ProfileImageFieldProps = {
  controller: ProfileImageController;
};

type ProfileTextFieldsProps = {
  controller: ProfileDraftController;
};

function ProfileImageField({ controller }: ProfileImageFieldProps) {
  const { imageUrl, isImageBusy, imageInputRef, handleImageInputChange, handleImageSelectClick, handleDeleteImage } = controller;

  return (
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
      <motion.button
        type="button"
        onClick={handleImageSelectClick}
        disabled={isImageBusy}
        className={PUBLIC_PAGE_IMAGE_EDIT_TRIGGER_CLASSNAME}
        aria-label={imageUrl ? "Change profile image" : "Upload profile image"}
        whileTap={IMAGE_TRIGGER_TAP}
        transition={IMAGE_BUTTON_TRANSITION}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt="Profile"
            fill
            sizes={PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE}
            quality={75}
            unoptimized
            loading="eager"
            className={PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME}
          />
        ) : (
          <span className={PUBLIC_PAGE_IMAGE_PLACEHOLDER_CLASSNAME}>
            <CircleFadingArrowUpIcon className="size-6" strokeWidth="3" />
            <span className="font-semibold">Add Avatar</span>
          </span>
        )}
        {isImageBusy ? (
          <div className={PUBLIC_PAGE_IMAGE_LOADING_OVERLAY_CLASSNAME}>
            <LoaderIcon className="size-5 animate-spin text-white" />
          </div>
        ) : null}
      </motion.button>
      {imageUrl ? (
        <motion.button
          type="button"
          className={cn(buttonVariants({ size: "icon-lg" }), PUBLIC_PAGE_IMAGE_REMOVE_BUTTON_CLASSNAME)}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void handleDeleteImage();
          }}
          disabled={isImageBusy}
          whileTap={IMAGE_REMOVE_TAP}
          transition={IMAGE_BUTTON_TRANSITION}
        >
          <TrashIcon className="size-4" strokeWidth={3} />
        </motion.button>
      ) : null}
    </div>
  );
}

function ProfileTextFields({ controller }: ProfileTextFieldsProps) {
  const { name, bio, handleNameChange, handleBioChange, handleEnterKeyDown } = controller;

  return (
    <section className={PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME}>
      <Textarea
        value={name}
        placeholder="Your name"
        rows={1}
        onChange={handleNameChange}
        onKeyDown={handleEnterKeyDown}
        className={PUBLIC_PAGE_NAME_FIELD_CLASSNAME}
      />
      <Textarea
        value={bio}
        placeholder="Your bio"
        rows={2}
        maxLength={200}
        onChange={handleBioChange}
        onKeyDown={handleEnterKeyDown}
        className={PUBLIC_PAGE_BIO_FIELD_CLASSNAME}
      />
    </section>
  );
}

/**
 * 공개 페이지 프로필의 텍스트/이미지 편집 로직을 합성 구조로 분리한 엔트리 컴포넌트.
 */
export function EditablePageProfile({ handle, initialName, initialBio, initialImage }: EditablePageProfileProps) {
  const profileDraft = useProfileDraft({ handle, initialName, initialBio });
  const profileImage = useProfileImageEditor({ handle, initialImage });

  return (
    <div className={PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME}>
      <section className="flex items-center gap-3">
        <ProfileImageField controller={profileImage} />
      </section>
      <ProfileTextFields controller={profileDraft} />
    </div>
  );
}
