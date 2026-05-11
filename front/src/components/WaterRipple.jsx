import waterBackLayer from "../../resources/images/water-back-layer.png";
import waterFrontLayer from "../../resources/images/water-front-layer.png";

const rippleLayers = {
  back: waterBackLayer,
  front: waterFrontLayer,
};

function WaterRipple({ layer = "back" }) {
  return (
    <div className={`water-layer water-layer-${layer}`} aria-hidden="true">
      <img src={rippleLayers[layer]} alt="" />
    </div>
  );
}

export default WaterRipple;
