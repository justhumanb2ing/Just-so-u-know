import { describe, expect, test } from "vitest";
import {
  buildMapboxForwardGeocodeUrl,
  mapMapboxFeatureToResultItem,
  normalizeMapSearchLanguage,
  requestMapSearchByQuery,
} from "@/service/page/map-search";

describe("map search service", () => {
  test("Mapbox forward geocode URL은 요청 파라미터를 올바르게 구성한다", () => {
    // Arrange
    const query = "서울";
    const accessToken = "test-token";
    const language = "ko,en";

    // Act
    const endpoint = buildMapboxForwardGeocodeUrl({
      query,
      accessToken,
      language,
    });

    // Assert
    expect(endpoint.searchParams.get("q")).toBe(query);
    expect(endpoint.searchParams.get("access_token")).toBe(accessToken);
    expect(endpoint.searchParams.get("language")).toBe(language);
    expect(endpoint.searchParams.get("limit")).toBe("5");
    expect(endpoint.searchParams.get("autocomplete")).toBe("true");
    expect(endpoint.searchParams.get("types")).toBe("country,place");
    expect(endpoint.searchParams.get("format")).toBe("v5");
  });

  test("언어 힌트는 정규화 후 ko,en을 포함한다", () => {
    // Arrange
    const rawLanguage = "ko-KR, en-US, ja-JP";

    // Act
    const language = normalizeMapSearchLanguage(rawLanguage);

    // Assert
    expect(language).toBe("ko,en,ja");
  });

  test("검색 결과 feature는 name, fullName, center를 가진 아이템으로 변환된다", () => {
    // Arrange
    const feature = {
      id: "place.123",
      text: "Seoul",
      place_name: "Seoul, South Korea",
      center: [126.978, 37.5665] as [number, number],
      geometry: {
        type: "Point" as const,
        coordinates: [126.978, 37.5665] as [number, number],
      },
    };

    // Act
    const item = mapMapboxFeatureToResultItem(feature);

    // Assert
    expect(item).toEqual({
      id: "place.123",
      name: "Seoul",
      fullName: "Seoul, South Korea",
      center: [126.978, 37.5665],
    });
  });

  test("토큰이 없으면 외부 API를 호출하지 않고 실패를 반환한다", async () => {
    // Arrange
    const originalToken = process.env.MAPBOX_ACCESS_TOKEN;
    process.env.MAPBOX_ACCESS_TOKEN = "";

    // Act
    const result = await requestMapSearchByQuery("Seoul");

    // Assert
    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "MAPBOX_ACCESS_TOKEN is not configured.",
    });

    process.env.MAPBOX_ACCESS_TOKEN = originalToken;
  });
});
