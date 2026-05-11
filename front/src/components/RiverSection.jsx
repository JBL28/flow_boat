import WaterRipple from "./WaterRipple.jsx";
import PaperBoat from "./PaperBoat.jsx";
import mountainLayer from "../../resources/images/mountain-shore-layer.png";
import reedLayer from "../../resources/images/reed-layer.png";

function RiverSection({ boats }) {
  return (
    <section className="river-section" aria-label="종이배가 흘러가는 강물 영역">
      <img className="mountain-layer" src={mountainLayer} alt="" aria-hidden="true" loading="lazy" />
      <WaterRipple layer="back" />
      <div className="river-shine" />
      {boats.map((boat) => (
        <PaperBoat key={boat.id} boat={boat} />
      ))}
      <WaterRipple layer="front" />
      <div className="reed-field" aria-hidden="true">
        <img className="reed-layer reed-layer-back" src={reedLayer} alt="" loading="lazy" />
        <img className="reed-layer reed-layer-front" src={reedLayer} alt="" loading="lazy" />
      </div>
    </section>
  );
}

export default RiverSection;
