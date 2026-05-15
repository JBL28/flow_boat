import WaterRipple from "./WaterRipple.jsx";
import PaperBoat from "./PaperBoat.jsx";
import Fireflies from "./Fireflies.jsx";

/**
 * 강 씬을 렌더링하는 섹션. 배경 레이어 이미지와 실시간 배 목록을 표시한다.
 *
 * 레이어 순서 (z-index 낮음 → 높음):
 *   mountain (0) → water-back (1) → Fireflies (3) → boats (4) → water-front (5) → reeds (6)
 *
 * 씬 전환 시 두 씬의 레이어가 동시에 렌더링되며 opacity로 크로스페이드된다.
 * water-front는 배보다 앞에(z-index 5) 있고 상단 mask-image로 페이드되어
 * 배가 물에 반쯤 잠긴 것처럼 보이게 한다.
 *
 * @param {{
 *   boats: Array<{ id: string, text: string, isNyan: boolean, lane: number, scale: number, drift: number }>,
 *   sceneLayers: Array<{
 *     id: string,
 *     mountain: { src: string, srcSet: string, sizes: string },
 *     waterBack: { src: string, srcSet: string, sizes: string },
 *     waterFront: { src: string, srcSet: string, sizes: string },
 *     reed: { src: string, srcSet: string, sizes: string },
 *     opacity: number,
 *   }>,
 * }} props
 */
function RiverSection({ boats, sceneLayers }) {
  const prioritySceneId = sceneLayers.find((scene) => scene.opacity > 0.5)?.id ?? sceneLayers[0]?.id;

  return (
    <section className="river-section" aria-label="종이배가 흘러가는 강물 영역">
      {sceneLayers.map((scene) => (
        <img
          key={`${scene.id}-mountain`}
          className="mountain-layer scene-fade-layer"
          src={scene.mountain.src}
          srcSet={scene.mountain.srcSet}
          sizes={scene.mountain.sizes}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="auto"
          decoding="async"
          style={{ opacity: scene.opacity }}
        />
      ))}
      <Fireflies />
      {sceneLayers.map((scene) => (
        <WaterRipple key={`${scene.id}-water-back`} layer="back" image={scene.waterBack} opacity={scene.opacity} />
      ))}
      <div className="river-shine" />
      {boats.map((boat) => (
        <PaperBoat key={boat.id} boat={boat} />
      ))}
      {sceneLayers.map((scene) => (
        <WaterRipple key={`${scene.id}-water-front`} layer="front" image={scene.waterFront} opacity={scene.opacity} />
      ))}
      {sceneLayers.map((scene) => (
        <div
          key={`${scene.id}-reeds`}
          className="reed-field scene-fade-layer"
          style={{ opacity: scene.opacity }}
          aria-hidden="true"
        >
          <img
            className="reed-layer reed-layer-back"
            src={scene.reed.src}
            srcSet={scene.reed.srcSet}
            sizes={scene.reed.sizes}
            alt=""
            loading="eager"
            fetchPriority="auto"
            decoding="async"
          />
          <img
            className="reed-layer reed-layer-front"
            src={scene.reed.src}
            srcSet={scene.reed.srcSet}
            sizes={scene.reed.sizes}
            alt=""
            loading="eager"
            fetchPriority={scene.id === prioritySceneId ? "high" : "auto"}
            decoding="async"
          />
        </div>
      ))}
      <p className="river-copyright">Open source on GitHub · JBL28</p>
    </section>
  );
}

export default RiverSection;
