import { useRef, useState } from "react";

function SoundToggle({ channels, todayCount }) {
  const audioRefs = useRef({});
  const [activeChannels, setActiveChannels] = useState({});
  const [starOpen, setStarOpen] = useState(false);

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
    <>
      <div className="star-channel">
        <button
          type="button"
          className="star-toggle"
          aria-label="오늘의 배 현황"
          aria-pressed={starOpen}
          onClick={() => setStarOpen((v) => !v)}
        >
          <svg className="star-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
        {starOpen && (
          <div className="star-box" role="status">
            오늘 <strong>{todayCount}</strong>개의 배가 지나갔습니다.
          </div>
        )}
        <span className="sound-label">오늘</span>
      </div>
      <div className="sound-controls" aria-label="사운드 설정">
        <div className="github-channel">
          <a
            href="https://github.com/JBL28/flow_boat"
            target="_blank"
            rel="noopener noreferrer"
            className="github-link"
            aria-label="GitHub 소스코드 보기"
          >
            <svg className="github-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <span className="sound-label">GitHub</span>
        </div>
        <div className="hint-channel">
          <div className="hint-wrap">
            <button type="button" className="hint-toggle" aria-label="서비스 안내">
              ?
            </button>
            <div className="hint-box" role="tooltip">
              서버에 메시지는 남지 않습니다.
              <br />
              지금 드는 생각을, 그저 흘려보내세요.
            </div>
          </div>
          <span className="sound-label">안내</span>
        </div>
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
    </>
  );
}

export default SoundToggle;
