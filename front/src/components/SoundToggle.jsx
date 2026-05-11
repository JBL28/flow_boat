import { useRef, useState } from "react";

function SoundToggle({ channels }) {
  const audioRefs = useRef({});
  const [activeChannels, setActiveChannels] = useState({});

  const toggleChannel = async (channel) => {
    const audio = audioRefs.current[channel.id];
    if (!audio) return;

    const isActive = Boolean(activeChannels[channel.id]);

    if (isActive) {
      audio.pause();
      setActiveChannels((current) => ({ ...current, [channel.id]: false }));
      return;
    }

    audio.loop = true;
    audio.volume = channel.volume;

    try {
      await audio.play();
      setActiveChannels((current) => ({ ...current, [channel.id]: true }));
    } catch {
      setActiveChannels((current) => ({ ...current, [channel.id]: false }));
    }
  };

  return (
    <div className="sound-controls" aria-label="사운드 설정">
      {channels.map((channel) => {
        const isActive = Boolean(activeChannels[channel.id]);

        return (
          <div className="sound-channel" key={channel.id}>
            <audio
              ref={(element) => {
                audioRefs.current[channel.id] = element;
              }}
              src={channel.src}
              preload="none"
              loop
            />
            <button
              type="button"
              className="sound-toggle"
              aria-label={`${channel.label} ${isActive ? "끄기" : "켜기"}`}
              aria-pressed={isActive}
              onClick={() => toggleChannel(channel)}
              title={`${channel.label} ${isActive ? "끄기" : "켜기"}`}
            >
              <svg
                className="speaker-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                {isActive ? (
                  <>
                    <path className="speaker-wave" d="M16 8.5a5 5 0 0 1 0 7" />
                    <path className="speaker-wave" d="M18.4 6a8.2 8.2 0 0 1 0 12" />
                  </>
                ) : (
                  <>
                    <path className="speaker-off" d="M17 9l4 4" />
                    <path className="speaker-off" d="M21 9l-4 4" />
                  </>
                )}
              </svg>
            </button>
            <span className="sound-label">{channel.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default SoundToggle;
