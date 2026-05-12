const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  top: Math.random() * 50,
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
