export const PUBLIC_PAGE_FIELD_CONTAINER_CLASSNAME = "flex flex-col gap-6";

export const PUBLIC_PAGE_FIELD_BASE_CLASSNAME =
  "min-h-0 resize-none rounded-none border-0 bg-transparent p-0 shadow-none outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-transparent";

export const PUBLIC_PAGE_NAME_CLASSNAME = "font-bold text-3xl leading-tight tracking-tighter md:text-4xl";

export const PUBLIC_PAGE_BIO_CLASSNAME = "text-base md:text-lg";

export const PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME = "flex flex-col gap-3";

export const PUBLIC_PAGE_NAME_FIELD_CLASSNAME = `${PUBLIC_PAGE_FIELD_BASE_CLASSNAME} ${PUBLIC_PAGE_NAME_CLASSNAME}`;

export const PUBLIC_PAGE_BIO_FIELD_CLASSNAME = `${PUBLIC_PAGE_FIELD_BASE_CLASSNAME} ${PUBLIC_PAGE_BIO_CLASSNAME}`;

export const PUBLIC_PAGE_IMAGE_FRAME_SIZE_CLASSNAME = "size-30 md:size-44";

export const PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE = "(min-width: 768px) 176px, 120px";

export const PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME = `relative ${PUBLIC_PAGE_IMAGE_FRAME_SIZE_CLASSNAME} overflow-hidden rounded-full bg-muted`;

export const PUBLIC_PAGE_IMAGE_EDIT_GROUP_CLASSNAME = `group relative ${PUBLIC_PAGE_IMAGE_FRAME_SIZE_CLASSNAME}`;

export const PUBLIC_PAGE_IMAGE_EDIT_TRIGGER_CLASSNAME =
  "relative size-full overflow-hidden rounded-full bg-muted disabled:cursor-not-allowed disabled:opacity-80";

export const PUBLIC_PAGE_IMAGE_CONTENT_CLASSNAME = "object-cover";

export const PUBLIC_PAGE_IMAGE_PLACEHOLDER_CLASSNAME = "flex flex-col items-center gap-1 text-muted-foreground text-sm";

export const PUBLIC_PAGE_IMAGE_LOADING_OVERLAY_CLASSNAME = "absolute inset-0 flex items-center justify-center bg-black/35";

export const PUBLIC_PAGE_HOVER_REMOVE_BUTTON_BASE_CLASSNAME =
  "pointer-events-none absolute z-10 rounded-full border border-black opacity-0 transition-opacity hover:bg-primary group-hover:pointer-events-auto group-hover:opacity-100";

export const PUBLIC_PAGE_IMAGE_REMOVE_BUTTON_CLASSNAME = `${PUBLIC_PAGE_HOVER_REMOVE_BUTTON_BASE_CLASSNAME} right-2 bottom-2 group-focus-within:pointer-events-auto group-focus-within:opacity-100`;

export const PUBLIC_PAGE_ITEM_REMOVE_BUTTON_CLASSNAME = `${PUBLIC_PAGE_HOVER_REMOVE_BUTTON_BASE_CLASSNAME} -right-3 -top-3`;
