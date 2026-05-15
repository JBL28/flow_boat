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

const imageUrls = import.meta.glob("../resources/images/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

function imageUrl(fileName) {
  return imageUrls[`../resources/images/${fileName}`];
}

const responsiveLayerSizes = "(max-width: 720px) 80vw, 100vw";
const responsiveReedSizes = [
  "(max-width: 720px) and (max-height: 600px) 222vw",
  "(max-width: 720px) and (max-height: 680px) 205vw",
  "(max-width: 720px) and (max-height: 780px) 188vw",
  "(max-width: 720px) 170vw",
  "100vw",
].join(", ");

function responsiveImage(baseName, originalWidth, sizes = responsiveLayerSizes) {
  return {
    src: imageUrl(`${baseName}.webp`),
    srcSet: [
      `${imageUrl(`${baseName}-480w.webp`)} 480w`,
      `${imageUrl(`${baseName}-768w.webp`)} 768w`,
      `${imageUrl(`${baseName}-1200w.webp`)} 1200w`,
      `${imageUrl(`${baseName}.webp`)} ${originalWidth}w`,
    ].join(", "),
    sizes,
  };
}

/** 씬 전환 순서 — 가중치 비교 및 activeScenes 정렬에 사용 */
export const sceneOrder = ["day", "twilight", "night"];

/**
 * 씬 id별 레이어 이미지 경로 맵.
 *
 * @type {Record<string, { id: string, label: string, mountain: object, waterBack: object, waterFront: object, reed: object }>}
 */
export const sceneAssets = {
  day: {
    id: "day",
    label: "낮",
    mountain: responsiveImage("mountain-land-layer-day", 1896),
    waterBack: responsiveImage("water-back-layer-day", 1898),
    waterFront: responsiveImage("water-front-layer-day", 1897),
    reed: responsiveImage("reed-layer-day", 1898, responsiveReedSizes),
  },
  twilight: {
    id: "twilight",
    label: "석양",
    mountain: responsiveImage("mountain-land-layer-twilight", 1896),
    waterBack: responsiveImage("water-back-layer-twilight", 1898),
    waterFront: responsiveImage("water-front-layer-twilight", 1897),
    reed: responsiveImage("reed-layer-twilight", 1898, responsiveReedSizes),
  },
  night: {
    id: "night",
    label: "밤",
    mountain: responsiveImage("mountain-land-layer", 1896),
    waterBack: responsiveImage("water-back-layer", 1898),
    waterFront: responsiveImage("water-front-layer", 1897),
    reed: responsiveImage("reed-layer", 1898, responsiveReedSizes),
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
