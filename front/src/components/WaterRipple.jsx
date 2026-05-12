/**
 * 물 깊이감을 연출하는 레이어 텍스처 이미지를 렌더링한다.
 *
 * @param {{ layer?: "back"|"front", src: string, opacity?: number }} props
 *   layer  - "back"(z-index 1, 배 뒤) 또는 "front"(z-index 5, 배 앞)
 *   src    - 현재 씬에 맞는 이미지 경로 (sceneAssets에서 주입)
 *   opacity - 씬 전환 가중치 (0~1); CSS transition이 페이드를 처리
 */
function WaterRipple({ layer = "back", src, opacity = 1 }) {
  return (
    <div className={`water-layer water-layer-${layer}`} style={{ opacity }} aria-hidden="true">
      <img src={src} alt="" />
    </div>
  );
}

export default WaterRipple;
