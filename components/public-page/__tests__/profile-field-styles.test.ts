import { describe, expect, test } from "vitest";
import {
  PUBLIC_PAGE_BIO_CLASSNAME,
  PUBLIC_PAGE_BIO_FIELD_CLASSNAME,
  PUBLIC_PAGE_IMAGE_EDIT_GROUP_CLASSNAME,
  PUBLIC_PAGE_IMAGE_FRAME_SIZE_CLASSNAME,
  PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE,
  PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME,
  PUBLIC_PAGE_NAME_CLASSNAME,
  PUBLIC_PAGE_NAME_FIELD_CLASSNAME,
  PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME,
} from "@/components/public-page/profile-field-styles";

describe("profile field styles", () => {
  test("프로필 텍스트 필드 컨테이너는 editable 기준 간격 규칙을 유지한다", () => {
    // Arrange
    const expectedContainerClassName = "flex flex-col gap-1.5";

    // Act
    const textFieldsContainerClassName = PUBLIC_PAGE_TEXT_FIELDS_CONTAINER_CLASSNAME;

    // Assert
    expect(textFieldsContainerClassName).toBe(expectedContainerClassName);
  });

  test("프로필 텍스트 필드는 base + 의미 클래스 조합 상수를 공유한다", () => {
    // Arrange
    const nameTokens = PUBLIC_PAGE_NAME_CLASSNAME.split(" ");
    const bioTokens = PUBLIC_PAGE_BIO_CLASSNAME.split(" ");
    const nameFieldTokens = PUBLIC_PAGE_NAME_FIELD_CLASSNAME.split(" ");
    const bioFieldTokens = PUBLIC_PAGE_BIO_FIELD_CLASSNAME.split(" ");

    // Act
    const nameFieldContainsNameTokens = nameTokens.every((token) => nameFieldTokens.includes(token));
    const bioFieldContainsBioTokens = bioTokens.every((token) => bioFieldTokens.includes(token));

    // Assert
    expect(nameFieldContainsNameTokens).toBe(true);
    expect(bioFieldContainsBioTokens).toBe(true);
  });

  test("프로필 이미지 뷰/편집 컨테이너는 동일한 프레임 크기 토큰을 공유한다", () => {
    // Arrange
    const frameSizeTokens = PUBLIC_PAGE_IMAGE_FRAME_SIZE_CLASSNAME.split(" ");
    const viewTokens = PUBLIC_PAGE_IMAGE_VIEW_CONTAINER_CLASSNAME.split(" ");
    const editGroupTokens = PUBLIC_PAGE_IMAGE_EDIT_GROUP_CLASSNAME.split(" ");

    // Act
    const viewContainsFrameSize = frameSizeTokens.every((token) => viewTokens.includes(token));
    const editContainsFrameSize = frameSizeTokens.every((token) => editGroupTokens.includes(token));

    // Assert
    expect(viewContainsFrameSize).toBe(true);
    expect(editContainsFrameSize).toBe(true);
  });

  test("프로필 이미지 sizes 속성은 owner/readonly에서 공통으로 사용하는 반응형 값이다", () => {
    // Arrange
    const expectedSizes = "(min-width: 768px) 176px, 120px";

    // Act
    const sizesAttribute = PUBLIC_PAGE_IMAGE_SIZES_ATTRIBUTE;

    // Assert
    expect(sizesAttribute).toBe(expectedSizes);
  });
});
