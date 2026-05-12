const FIREFLIES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  bottom: 42 + Math.random() * 38,
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
