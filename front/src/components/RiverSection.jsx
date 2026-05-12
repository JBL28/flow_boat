import WaterRipple from "./WaterRipple.jsx";
import PaperBoat from "./PaperBoat.jsx";
import Fireflies from "./Fireflies.jsx";
import mountainLayer from "../../resources/images/mountain-land-layer.webp";
import reedLayer from "../../resources/images/reed-layer.webp";

/**
 * River stage that renders the animated scene and all live boat messages.
 *
 * Layer order (z-index, low → high):
 *   mountain-layer (0) → Fireflies (3) → boats (4) → water-front (5) → reeds (6)
 *
 * @param {{ boats: Array<{id: string, text: string, isNyan: boolean, lane: number, scale: number, drift: number}> }} props
 */
function RiverSection({ boats }) {
  return (
    <section className="river-section" aria-label="종이배가 흘러가는 강물 영역">
      <img className="mountain-layer" src={mountainLayer} alt="" aria-hidden="true" loading="lazy" />
      <Fireflies />
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
      <p className="river-copyright">Open source on GitHub · JBL28</p>
    </section>
  );
}

export default RiverSection;
