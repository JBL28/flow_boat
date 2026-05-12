/**
 * @fileoverview 씬별 이미지 리소스 및 수동 전환 커맨드 정의.
 *
 * 씬은 세 가지: "day"(낮), "twilight"(석양/여명), "night"(밤).
 * 각 씬은 4개 레이어 이미지를 가진다:
 *   mountain (z-index 0) · water-back (z-index 1) · water-front (z-index 5) · reed (z-index 6)
 *
 * 전환 중에는 두 씬이 동시에 DOM에 렌더링되며, 각 레이어의 opacity가
 * useSceneBackground의 가중치(0~1)에 따라 CSS transition으로 페이드된다.
 *
 * 밤 씬은 원본 이미지(접미사 없음)를 재사용한다.
 */

import mountainDay from "../resources/images/mountain-land-layer-day.webp";
import mountainNight from "../resources/images/mountain-land-layer.webp";
import mountainTwilight from "../resources/images/mountain-land-layer-twilight.webp";
import reedDay from "../resources/images/reed-layer-day.webp";
import reedNight from "../resources/images/reed-layer.webp";
import reedTwilight from "../resources/images/reed-layer-twilight.webp";
import waterBackDay from "../resources/images/water-back-layer-day.webp";
import waterBackNight from "../resources/images/water-back-layer.webp";
import waterBackTwilight from "../resources/images/water-back-layer-twilight.webp";
import waterFrontDay from "../resources/images/water-front-layer-day.webp";
import waterFrontNight from "../resources/images/water-front-layer.webp";
import waterFrontTwilight from "../resources/images/water-front-layer-twilight.webp";

/** 씬 전환 순서 — 가중치 비교 및 activeScenes 정렬에 사용 */
export const sceneOrder = ["day", "twilight", "night"];

/**
 * 씬 id별 레이어 이미지 경로 맵.
 *
 * @type {Record<string, { id: string, label: string, mountain: string, waterBack: string, waterFront: string, reed: string }>}
 */
export const sceneAssets = {
  day: {
    id: "day",
    label: "낮",
    mountain: mountainDay,
    waterBack: waterBackDay,
    waterFront: waterFrontDay,
    reed: reedDay,
  },
  twilight: {
    id: "twilight",
    label: "석양",
    mountain: mountainTwilight,
    waterBack: waterBackTwilight,
    waterFront: waterFrontTwilight,
    reed: reedTwilight,
  },
  night: {
    id: "night",
    label: "밤",
    mountain: mountainNight,
    waterBack: waterBackNight,
    waterFront: waterFrontNight,
    reed: reedNight,
  },
};

/**
 * textarea에 입력된 텍스트가 씬 고정 커맨드인지 판별하는 맵.
 * 매칭되면 해당 텍스트는 배를 띄우지 않고 배경 씬을 고정시킨다.
 *
 * @type {Map<string, string>}
 */
export const sceneCommands = new Map([
  ["낮", "day"],
  ["밤", "night"],
  ["석양", "twilight"],
  ["여명", "twilight"],
]);
