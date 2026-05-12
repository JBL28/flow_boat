/**
 * @fileoverview 시간·일출/일몰 기반 씬(배경) 전환 로직.
 *
 * 씬은 세 가지: "day"(낮), "twilight"(석양/여명), "night"(밤).
 * 각 씬은 가중치(0~1)를 가지며, 전환 구간에서 두 씬의 가중치 합이 1이 된다.
 * 가중치는 CSS custom property로 .app-shell에 주입되고, CSS transition이 페이드를 처리한다.
 *
 * 실제 일출/일몰 시각은 useSunTimes (Open-Meteo API, 서울 기준)에서 가져오며,
 * 일출/일몰 ±15분 구간을 석양으로 블렌딩한다. 나머지 시간은 낮 또는 밤 단일 씬.
 *
 * 수동 고정(낮/밤/석양 키워드): manualScene이 설정되면 해당 씬 가중치를 1로 고정하고
 * 전환 시간을 70초 → 8초로 단축한다.
 */

import { useEffect, useMemo, useState } from "react";
import { sceneAssets, sceneOrder } from "../sceneAssets.js";
import { useSunTimes, FALLBACK_SUNRISE_MINUTES, FALLBACK_SUNSET_MINUTES } from "./useSunTimes.js";

const minuteMs = 60_000;
const visibleThreshold = 0.01;
const manualTransitionMs = 8_000;
const timeTransitionMs = 70_000;

/** 모든 씬 가중치가 0인 기본 객체 */
const emptyWeights = {
  day: 0,
  twilight: 0,
  night: 0,
};

/**
 * 세 씬의 가중치를 RGB 채널별로 선형 보간해 정수값을 반환한다.
 * river-shine 색상 계산에 사용.
 *
 * @param {{ day: number, twilight: number, night: number }} weights
 * @param {{ day: number, twilight: number, night: number }} channels
 * @returns {number}
 */
function weightedChannel(weights, channels) {
  return Math.round(
    weights.day * channels.day +
    weights.twilight * channels.twilight +
    weights.night * channels.night,
  );
}

/**
 * start~end 구간에서 minutes의 진행률(0~1)을 반환한다.
 *
 * @param {number} minutes
 * @param {number} start
 * @param {number} end
 * @returns {number}
 */
function progressBetween(minutes, start, end) {
  return Math.min(1, Math.max(0, (minutes - start) / (end - start)));
}

/**
 * from 씬에서 to 씬으로 progress만큼 블렌딩된 가중치 객체를 반환한다.
 *
 * @param {string} from
 * @param {string} to
 * @param {number} progress 0(from 100%) ~ 1(to 100%)
 * @returns {{ day: number, twilight: number, night: number }}
 */
function mix(from, to, progress) {
  return {
    ...emptyWeights,
    [from]: 1 - progress,
    [to]: progress,
  };
}

/**
 * 주어진 시각과 일출/일몰 시각으로부터 씬 가중치를 계산한다.
 *
 * 전환 타임라인 (일출/일몰 각각 ±15분):
 * ```
 * ── 밤 ──► [일출-15분] night→twilight [일출] twilight→day [일출+15분] ►── 낮 ──
 * ── 낮 ──► [일몰-15분] day→twilight  [일몰] twilight→night [일몰+15분] ►── 밤 ──
 * ```
 * 전환 구간 외에는 단일 씬 가중치 1, 나머지 0.
 *
 * @param {Date} [date=new Date()]
 * @param {number} [sunriseMinutes=FALLBACK_SUNRISE_MINUTES] 자정 기준 분 단위 일출 시각
 * @param {number} [sunsetMinutes=FALLBACK_SUNSET_MINUTES]  자정 기준 분 단위 일몰 시각
 * @returns {{ day: number, twilight: number, night: number }}
 */
export function getTimeSceneWeights(
  date = new Date(),
  sunriseMinutes = FALLBACK_SUNRISE_MINUTES,
  sunsetMinutes = FALLBACK_SUNSET_MINUTES,
) {
  const minutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;

  const srTwiStart = sunriseMinutes - 15;  // night → twilight 시작
  const srDayStart = sunriseMinutes + 15;  // twilight → day 완료

  const ssTwiStart = sunsetMinutes - 15;   // day → twilight 시작
  const ssNightStart = sunsetMinutes + 15; // twilight → night 완료

  if (minutes < srTwiStart)     return { ...emptyWeights, night: 1 };
  if (minutes < sunriseMinutes) return mix("night", "twilight", progressBetween(minutes, srTwiStart, sunriseMinutes));
  if (minutes < srDayStart)     return mix("twilight", "day", progressBetween(minutes, sunriseMinutes, srDayStart));
  if (minutes < ssTwiStart)     return { ...emptyWeights, day: 1 };
  if (minutes < sunsetMinutes)  return mix("day", "twilight", progressBetween(minutes, ssTwiStart, sunsetMinutes));
  if (minutes < ssNightStart)   return mix("twilight", "night", progressBetween(minutes, sunsetMinutes, ssNightStart));
  return { ...emptyWeights, night: 1 };
}

/**
 * @param {Array<{ day: number, twilight: number, night: number }>} weights
 * @returns {string[]} 가중치 > visibleThreshold인 씬 id 배열
 */
function getVisibleSceneIds(weights) {
  return sceneOrder.filter((sceneId) => weights[sceneId] > visibleThreshold);
}

/**
 * @param {{ day: number, twilight: number, night: number }} weights
 * @returns {string} 가중치가 가장 높은 씬 id
 */
function getDominantScene(weights) {
  return sceneOrder.reduce((dominant, sceneId) => (
    weights[sceneId] > weights[dominant] ? sceneId : dominant
  ), "night");
}

/**
 * 여러 씬 배열을 합쳐 중복 없이 반환한다.
 * 전환 중 두 씬이 동시에 DOM에 존재해야 할 때 activeScenes를 구성하는 데 쓰인다.
 *
 * @param {...string[]} sceneGroups
 * @returns {string[]}
 */
function uniqueScenes(...sceneGroups) {
  return [...new Set(sceneGroups.flat())];
}

/**
 * 시간 기반(또는 수동 고정) 씬 배경 시스템을 구동하는 훅.
 *
 * ## 동작 방식
 * 1. useSunTimes로 오늘의 서울 일출/일몰 시각을 가져온다 (초기엔 폴백값 사용).
 * 2. 1분마다 현재 시각을 갱신하고, getTimeSceneWeights로 목표 가중치를 계산한다.
 * 3. requestAnimationFrame 안에서 displayedWeights와 appliedTransitionDuration을
 *    동시에 업데이트한다. 두 값이 같은 rAF 콜백에서 바뀌어야 하는 이유:
 *    하늘 색상(CSS variable → cascade)과 이미지(inline style)가 서로 다른
 *    브라우저 스타일 재계산 패스를 탈 수 있어, 같은 커밋에서 묶지 않으면
 *    --scene-transition-duration과 opacity가 다른 프레임에 적용되어 속도가 달라진다.
 * 4. 가중치를 CSS custom property로 .app-shell에 주입한다.
 *    각 레이어(하늘 그라디언트, 산, 물, 갈대, 별, 달, 반딧불, 강 반사광)가
 *    이 값을 참조해 CSS transition으로 부드럽게 페이드된다.
 *
 * ## 수동 고정
 * manualScene이 null이 아니면 해당 씬을 가중치 1로 고정하고,
 * 전환 시간을 70초(시간 기반) → 8초(수동)로 단축한다.
 * 사용자가 "낮/밤/석양/여명"을 입력하면 App에서 manualScene을 설정한다.
 *
 * @param {string|null} manualScene - "day" | "twilight" | "night" | null
 * @returns {{
 *   dominantScene: string,
 *   isManualScene: boolean,
 *   sceneLayers: Array<{
 *     id: string,
 *     mountain: string,
 *     waterBack: string,
 *     waterFront: string,
 *     reed: string,
 *     opacity: number,
 *   }>,
 *   sceneStyle: Record<string, string|number>,
 * }}
 */
export function useSceneBackground(manualScene) {
  const { sunriseMinutes, sunsetMinutes } = useSunTimes();
  const [now, setNow] = useState(() => new Date());
  const [displayedWeights, setDisplayedWeights] = useState(() => getTimeSceneWeights(new Date()));
  const [activeScenes, setActiveScenes] = useState(() => getVisibleSceneIds(displayedWeights));
  // appliedTransitionDuration은 displayedWeights와 같은 rAF에서 업데이트해
  // CSS transition duration과 opacity가 항상 같은 브라우저 스타일 패스에서 적용되도록 한다.
  const [appliedTransitionDuration, setAppliedTransitionDuration] = useState("70s");

  useEffect(() => {
    if (manualScene) return undefined;

    const timerId = window.setInterval(() => setNow(new Date()), minuteMs);
    return () => window.clearInterval(timerId);
  }, [manualScene]);

  const targetWeights = useMemo(() => {
    if (manualScene) {
      return { ...emptyWeights, [manualScene]: 1 };
    }

    return getTimeSceneWeights(now, sunriseMinutes, sunsetMinutes);
  }, [manualScene, now, sunriseMinutes, sunsetMinutes]);

  useEffect(() => {
    const transitionMs = manualScene ? manualTransitionMs : timeTransitionMs;
    const targetScenes = getVisibleSceneIds(targetWeights);
    const currentScenes = getVisibleSceneIds(displayedWeights);

    // 전환 중 두 씬이 동시에 DOM에 존재해야 크로스페이드가 가능하다.
    setActiveScenes((current) => uniqueScenes(current, currentScenes, targetScenes));

    const nextDuration = manualScene ? "8s" : "70s";
    const frameId = window.requestAnimationFrame(() => {
      setDisplayedWeights(targetWeights);
      setAppliedTransitionDuration(nextDuration);
    });

    // 전환 완료 후 가중치 0인 씬을 DOM에서 제거한다.
    const cleanupId = window.setTimeout(() => {
      setActiveScenes((current) => current.filter((sceneId) => targetWeights[sceneId] > visibleThreshold));
    }, transitionMs + 500);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(cleanupId);
    };
  }, [displayedWeights, manualScene, targetWeights]);

  const sceneLayers = useMemo(
    () =>
      activeScenes.map((sceneId) => ({
        ...sceneAssets[sceneId],
        opacity: displayedWeights[sceneId] ?? 0,
      })),
    [activeScenes, displayedWeights],
  );

  const dominantScene = getDominantScene(displayedWeights);
  const twilightWeight = displayedWeights.twilight;
  const nightWeight = displayedWeights.night;
  const dayWeight = displayedWeights.day;
  const weights = { day: dayWeight, twilight: twilightWeight, night: nightWeight };

  // 강 반사광 색상: 낮(하늘색), 석양(주황), 밤(청색)을 가중치로 보간
  const riverShineRgb = [
    weightedChannel(weights, { day: 176, twilight: 255, night: 92 }),
    weightedChannel(weights, { day: 224, twilight: 188, night: 145 }),
    weightedChannel(weights, { day: 246, twilight: 92, night: 210 }),
  ].join(", ");
  const riverShineOpacity = dayWeight * 0.42 + twilightWeight * 0.72 + nightWeight * 0.34;

  const sceneStyle = {
    "--scene-day-opacity": dayWeight,
    "--scene-twilight-opacity": twilightWeight,
    "--scene-night-opacity": nightWeight,
    "--scene-stars-opacity": Math.max(nightWeight, twilightWeight * 0.28),
    "--scene-moon-opacity": Math.max(nightWeight, twilightWeight * 0.46),
    "--scene-firefly-opacity": Math.max(nightWeight * 0.48, twilightWeight * 0.36),
    "--scene-river-shine-rgb": riverShineRgb,
    "--scene-river-shine-opacity": riverShineOpacity,
    "--scene-transition-duration": appliedTransitionDuration,
  };

  return {
    dominantScene,
    isManualScene: Boolean(manualScene),
    sceneLayers,
    sceneStyle,
  };
}
