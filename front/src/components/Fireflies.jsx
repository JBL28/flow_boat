/**
 * Decorative firefly particles floating above the river bank.
 *
 * Each firefly runs two independent CSS animations via comma-separated
 * animation-duration / animation-delay inline styles:
 *   1. firefly-blink  — opacity pulse (short cycle, ~1.6–3.4 s)
 *   2. firefly-float-N — slow drifting path (long cycle, ~6–13 s)
 *
 * Three float-path variants (v1–v3) are cycled so nearby fireflies travel
 * visibly different routes. Positions are fixed at module load for render
 * stability. Responsive CSS reduces the count on small viewports.
 */

// Computed once at module load — stable across re-renders.
const FIREFLIES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  bottom: 42 + Math.random() * 38,  // upper portion of river section, near the reeds
  left: 4 + Math.random() * 92,
  blinkDuration: 1.6 + Math.random() * 1.8,
  blinkDelay: Math.random() * 4,
  floatDuration: 6 + Math.random() * 7,
  floatDelay: Math.random() * 8,
  variant: (i % 3) + 1,
}));

function Fireflies() {
  return (
    <div className="firefly-field" aria-hidden="true">
      {FIREFLIES.map((ff) => (
        <span
          key={ff.id}
          className={`firefly firefly-v${ff.variant}`}
          style={{
            bottom: `${ff.bottom}%`,
            left: `${ff.left}%`,
            animationDuration: `${ff.blinkDuration}s, ${ff.floatDuration}s`,
            animationDelay: `${ff.blinkDelay}s, ${ff.floatDelay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default Fireflies;
