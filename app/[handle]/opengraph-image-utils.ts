const OPEN_GRAPH_RENDERABLE_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg"] as const;

/**
 * `next/og`에서 안정적으로 렌더 가능한 이미지 URL만 통과시킨다.
 * 현재는 png/jpg/jpeg 확장자만 허용하고 나머지는 null로 폴백한다.
 */
export function toRenderableOpenGraphImageUrl(imageUrl: string | null | undefined) {
  const normalizedImageUrl = imageUrl?.trim();

  if (!normalizedImageUrl) {
    return null;
  }

  try {
    const parsedImageUrl = new URL(normalizedImageUrl);
    const lowerPathname = parsedImageUrl.pathname.toLowerCase();
    const isSupportedExtension = OPEN_GRAPH_RENDERABLE_IMAGE_EXTENSIONS.some((extension) => lowerPathname.endsWith(extension));

    return isSupportedExtension ? normalizedImageUrl : null;
  } catch {
    return null;
  }
}
