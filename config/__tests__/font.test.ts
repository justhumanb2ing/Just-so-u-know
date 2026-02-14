import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRootDir = resolve(currentDir, "../..");
const fontConfigDir = resolve(projectRootDir, "config");
const fontConfigFilePath = resolve(fontConfigDir, "font.ts");
const publicFontDir = resolve(projectRootDir, "public", "font");

describe("config/font.ts", () => {
  it("A2Z 로컬 폰트의 weight별 매핑이 100~900까지 모두 정의되어 있어야 한다", () => {
    // Arrange
    const expectedMappings = [
      { weight: "100", path: "../public/font/a2z-thin.woff2" },
      { weight: "200", path: "../public/font/a2z-extralight.woff2" },
      { weight: "300", path: "../public/font/a2z-light.woff2" },
      { weight: "400", path: "../public/font/a2z-regular.woff2" },
      { weight: "500", path: "../public/font/a2z-medium.woff2" },
      { weight: "600", path: "../public/font/a2z-semibold.woff2" },
      { weight: "700", path: "../public/font/a2z-bold.woff2" },
      { weight: "800", path: "../public/font/a2z-extrabold.woff2" },
      { weight: "900", path: "../public/font/a2z-black.woff2" },
    ];

    // Act
    const fontConfigSource = readFileSync(fontConfigFilePath, "utf-8");
    const hasAllMappings = expectedMappings.every(({ weight, path }) => {
      return fontConfigSource.includes(`{ path: "${path}", weight: "${weight}", style: "normal" }`);
    });

    // Assert
    expect(hasAllMappings).toBe(true);
  });

  it("font.ts에서 참조하는 로컬 폰트 파일이 public/font에 실제로 존재해야 한다", () => {
    // Arrange
    const expectedFontFiles = [
      "a2z-thin.woff2",
      "a2z-extralight.woff2",
      "a2z-light.woff2",
      "a2z-regular.woff2",
      "a2z-medium.woff2",
      "a2z-semibold.woff2",
      "a2z-bold.woff2",
      "a2z-extrabold.woff2",
      "a2z-black.woff2",
    ];

    // Act
    const allFilesExist = expectedFontFiles.every((fontFileName) => existsSync(resolve(publicFontDir, fontFileName)));

    // Assert
    expect(allFilesExist).toBe(true);
  });
});
