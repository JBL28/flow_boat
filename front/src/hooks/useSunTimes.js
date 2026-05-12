import { useEffect, useState } from "react";

/**
 * @fileoverview 서울 기준 일출/일몰 시간을 Open-Meteo API에서 가져오는 훅.
 *
 * 사용 API: Open-Meteo (https://open-meteo.com/)
 *   - 무료, API 키 불필요
 *   - 엔드포인트: GET /v1/forecast?daily=sunrise,sunset&timezone=Asia/Seoul
 *   - 응답 예시: { "daily": { "sunrise": ["2025-05-12T05:29"], "sunset": ["2025-05-12T19:38"] } }
 *   - timezone=Asia/Seoul 파라미터로 KST 로컬 시간이 그대로 반환됨
 *
 * 위치: 서울 (위도 37.5665°N, 경도 126.9780°E)
 *
 * 시간 파싱 방식: "2025-05-12T05:29" → T 기준 분리 → HH:MM 직접 파싱.
 * Date 객체를 사용하지 않는 이유: new Date("2025-05-12T05:29")는 브라우저 로컬
 * 타임존 기준으로 해석되어 KST가 아닌 환경에서 틀린 시간이 나올 수 있음.
 *
 * 폴백: 네트워크 오류 또는 fetch 완료 전에는 서울 연평균 기준값을 사용.
 */

/** 서울 위도 (WGS-84) */
const LAT = 37.5665;
/** 서울 경도 (WGS-84) */
const LON = 126.9780;

/** 폴백 일출 시각 — 서울 연평균 기준 (분, 자정 기준) */
export const FALLBACK_SUNRISE_MINUTES = 360; // 06:00 KST
/** 폴백 일몰 시각 — 서울 연평균 기준 (분, 자정 기준) */
export const FALLBACK_SUNSET_MINUTES = 1140; // 19:00 KST

/**
 * ISO 로컬 시각 문자열을 자정 기준 분으로 변환한다.
 *
 * @param {string} isoString - "YYYY-MM-DDTHH:MM" 형식의 로컬 시각 문자열
 * @returns {number} 자정(00:00)으로부터의 경과 분
 * @example isoTimeToMinutes("2025-05-12T05:29") // → 329
 */
function isoTimeToMinutes(isoString) {
  const timePart = isoString.split("T")[1];
  const [h, m] = timePart.split(":").map(Number);
  return h * 60 + m;
}

/**
 * 오늘의 서울 일출/일몰 시각을 반환하는 훅.
 *
 * 마운트 시 Open-Meteo API를 1회 호출하고, 성공하면 실제 값으로 업데이트한다.
 * 실패하거나 응답 전이라면 폴백(FALLBACK_*)을 유지한다.
 *
 * @returns {{ sunriseMinutes: number, sunsetMinutes: number }}
 *   자정 기준 분 단위의 일출/일몰 시각.
 *   초기값은 FALLBACK_SUNRISE_MINUTES / FALLBACK_SUNSET_MINUTES.
 */
export function useSunTimes() {
  const [sunTimes, setSunTimes] = useState({
    sunriseMinutes: FALLBACK_SUNRISE_MINUTES,
    sunsetMinutes: FALLBACK_SUNSET_MINUTES,
  });

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=sunrise,sunset&timezone=Asia%2FSeoul&forecast_days=1`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        const sunrise = data.daily?.sunrise?.[0];
        const sunset = data.daily?.sunset?.[0];
        if (sunrise && sunset) {
          setSunTimes({
            sunriseMinutes: isoTimeToMinutes(sunrise),
            sunsetMinutes: isoTimeToMinutes(sunset),
          });
        }
      })
      .catch(() => {
        // 네트워크 오류 또는 언마운트 시 AbortError — 폴백값 유지
      });

    return () => controller.abort();
  }, []);

  return sunTimes;
}
