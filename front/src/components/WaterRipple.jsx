/**
 * 물 깊이감을 연출하는 레이어 텍스처 이미지를 렌더링한다.
 *
 * @param {{ layer?: "back"|"front", image: { src: string, srcSet: string, sizes: string }, opacity?: number }} props
 *   layer  - "back"(z-index 1, 배 뒤) 또는 "front"(z-index 5, 배 앞)
 *   image  - 현재 씬에 맞는 이미지 경로와 srcset (sceneAssets에서 주입)
 *   opacity - 씬 전환 가중치 (0~1); CSS transition이 페이드를 처리
 */
function WaterRipple({ layer = "back", image, opacity = 1 }) {
  return (
    <div className={`water-layer water-layer-${layer}`} style={{ opacity }} aria-hidden="true">
      <img src={image.src} srcSet={image.srcSet} sizes={image.sizes} alt="" />
    </div>
  );
}

export default WaterRipple;
