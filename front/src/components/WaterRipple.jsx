import waterBackLayer from "../../resources/images/water-back-layer.webp";
import waterFrontLayer from "../../resources/images/water-front-layer.webp";

const rippleLayers = {
  back: waterBackLayer,
  front: waterFrontLayer,
};

/**
 * Render one of the layered water textures that create depth around the boats.
 */
function WaterRipple({ layer = "back" }) {
  return (
    <div className={`water-layer water-layer-${layer}`} aria-hidden="true">
      <img src={rippleLayers[layer]} alt="" />
    </div>
  );
}

export default WaterRipple;
