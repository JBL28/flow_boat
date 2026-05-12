/**
 * Decorative star field rendered in the sky section.
 *
 * Each star's position, size, and twinkle timing are randomised once at module
 * load so the layout is stable across re-renders. Responsive CSS hides excess
 * stars on narrow or short viewports to keep GPU layer counts low.
 */

// Computed once at module load — identical on every render, no layout thrash.
const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  top: Math.random() * 50,   // upper 50 % keeps stars above the mountain horizon
  left: Math.random() * 100,
  size: 2 + Math.random() * 1.5,
  delay: Math.random() * 7,
  duration: 2.8 + Math.random() * 4,
}));

function StarField() {
  return (
    <div className="starfield" aria-hidden="true">
      {STARS.map((s) => (
        <span
          key={s.id}
          className="starfield-dot"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default StarField;
