import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import paperBoatSrc from "../../resources/images/paper-boat.webp";
import nyanCat256Src from "../../resources/images/nyan-cat-256w.webp";
import nyanCat384Src from "../../resources/images/nyan-cat-384w.webp";
import nyanCat640Src from "../../resources/images/nyan-cat-640w.webp";
import nyanCatSrc from "../../resources/images/nyan-cat.gif";

const nyanCatSrcSet = [
  `${nyanCat256Src} 256w`,
  `${nyanCat384Src} 384w`,
  `${nyanCat640Src} 640w`,
].join(", ");

const nyanCatSizes = "(max-height: 622px) 123px, (min-height: 978px) 193px, 19.7vh";

const imageLoadCache = new Map();

function getImageCacheKey({ src, srcSet = "", sizes = "" }) {
  return [src, srcSet, sizes].join("|");
}

function preloadImage(descriptor) {
  const key = getImageCacheKey(descriptor);
  const cached = imageLoadCache.get(key);
  if (cached) return cached;

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    if (descriptor.sizes) image.sizes = descriptor.sizes;
    if (descriptor.srcSet) image.srcset = descriptor.srcSet;
    image.onload = resolve;
    image.onerror = resolve;
    image.src = descriptor.src;
  });

  imageLoadCache.set(key, promise);
  return promise;
}

function useCachedImage(descriptor) {
  const key = getImageCacheKey(descriptor);
  const [isLoaded, setIsLoaded] = useState(() => imageLoadCache.has(key));

  useEffect(() => {
    let isActive = true;
    preloadImage(descriptor).then(() => {
      if (isActive) setIsLoaded(true);
    });

    return () => {
      isActive = false;
    };
  }, [descriptor, key]);

  return isLoaded;
}

const paperBoatImage = {
  src: paperBoatSrc,
};

const nyanCatImage = {
  src: nyanCatSrc,
  srcSet: nyanCatSrcSet,
  sizes: nyanCatSizes,
};

function CachedPaperBoatImage() {
  const isLoaded = useCachedImage(paperBoatImage);

  if (!isLoaded) {
    return <span className="paper-boat paper-boat-placeholder" aria-hidden="true" />;
  }

  return <img className="paper-boat" src={paperBoatSrc} alt="종이배" draggable="false" />;
}

function CachedNyanCatImage() {
  const isLoaded = useCachedImage(nyanCatImage);

  if (!isLoaded) {
    return <span className="nyan-cat nyan-cat-placeholder" aria-hidden="true" />;
  }

  return (
    <picture className="nyan-cat-frame">
      <source type="image/webp" srcSet={nyanCatSrcSet} sizes={nyanCatSizes} />
      <img className="nyan-cat" src={nyanCatSrc} alt="냥캣" draggable="false" />
    </picture>
  );
}

/**
 * Animate a single note-carrying boat across the river.
 *
 * The parent chooses lane, scale, and drift so multiple boats feel varied while
 * keeping the route predictable across viewport sizes.
 *
 * Easter egg: when `boat.isNyan` is true (text contains '냥', 'nyan', or '야옹')
 * the paper boat is replaced with a nyan-cat GIF. The cat uses strictly linear
 * easing on x/y so it maintains a constant speed with no acceleration.
 *
 * @param {{ boat: {
 *   id: string,
 *   text: string,
 *   isNyan: boolean,
 *   lane: number,
 *   scale: number,
 *   drift: number,
 * }}} props
 */
function PaperBoat({ boat }) {
  if (boat.isNyan) {
    return (
      <motion.div
        className="boat-track"
        style={{ willChange: "transform, opacity" }}
        initial={{ x: "-62vw", y: boat.lane, opacity: 0 }}
        animate={{
          x: "64vw",
          y: boat.lane,
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          // Per-property easing: linear on position for constant speed,
          // custom times on opacity for a quick fade-in/out at the edges.
          x: { duration: 48, ease: "linear" },
          y: { duration: 48, ease: "linear" },
          opacity: { duration: 48, times: [0, 0.04, 0.96, 1], ease: "linear" },
        }}
      >
        <div className="boat-wrap" tabIndex={0}>
          <CachedNyanCatImage />
          <div className="boat-note">
            <strong>고양이의 생각</strong>
            <span>{boat.text}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="boat-track"
      style={{ willChange: "transform, opacity" }}
      initial={{
        opacity: 0,
        x: "-62vw",
        y: boat.lane,
        scale: boat.scale * 0.78,
        rotate: -8,
      }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        x: ["-62vw", "-42vw", "-8vw", "28vw", "64vw"],
        y: [
          boat.lane,
          3 + boat.lane,
          boat.lane + boat.drift,
          2 + boat.lane,
          5 + boat.lane,
        ],
        scale: [boat.scale * 0.78, boat.scale, boat.scale, boat.scale * 0.94, boat.scale * 0.86],
        rotate: [-8, -2, 3, -1, 4],
      }}
      transition={{ duration: 48, times: [0, 0.13, 0.32, 0.82, 1], ease: "easeInOut" }}
    >
      <motion.div
        className="boat-wrap"
        tabIndex={0}
        style={{ willChange: "transform" }}
        animate={{ y: [0, -5, 0], rotate: [-1, 1.5, -1] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <CachedPaperBoatImage />
        <div className="boat-note">
          <strong>흘려보낸 생각</strong>
          <span>{boat.text}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PaperBoat;
