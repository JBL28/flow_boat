import { useCallback, useEffect, useRef, useState } from "react";
import SkySection from "./components/SkySection.jsx";
import RiverSection from "./components/RiverSection.jsx";
import SoundToggle from "./components/SoundToggle.jsx";
import { sceneCommands } from "./sceneAssets.js";
import { useSceneBackground } from "./hooks/useSceneBackground.js";
import ambienceSrc from "../resources/sound/ambience.mp3";
import musicSrc from "../resources/sound/song.mp3";

/** 배가 화면에서 사라지기까지의 시간 (ms) */
const boatLifetimeMs = 49500;

/**
 * 브라우저가 접속할 WebSocket URL.
 *
 * VITE_WS_URL이 비어있으면 같은 오리진의 /ws 프록시로 폴스루한다.
 * ?? 대신 ||를 쓰는 이유: 빈 문자열("")도 폴스루해야 하기 때문.
 */
const wsUrl =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

// 서버가 거부하기 전에 버튼을 먼저 비활성화하기 위해 백엔드 규칙을 클라이언트에서 미러링한다.
const clientRateLimitWindowMs = 1000;
const clientRateLimitMax = 3;

function App() {
  const [boats, setBoats] = useState([]);
  const [worryText, setWorryText] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [todayBoatCount, setTodayBoatCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [manualScene, setManualScene] = useState(null);
  const { dominantScene, isManualScene, sceneLayers, sceneStyle } = useSceneBackground(manualScene);
  const nextBoatId = useRef(0);
  const timersRef = useRef([]);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const sendTimestampsRef = useRef([]);
  const rateLimitTimerRef = useRef(null);

  const removeBoat = useCallback((boatId) => {
    setBoats((currentBoats) => currentBoats.filter((boat) => boat.id !== boatId));
  }, []);

  /**
   * 배를 로컬 애니메이션 큐에 추가한다.
   *
   * 서버에서 받은 메시지는 안정적인 UUID를 id로 사용한다.
   * 오프라인(WebSocket 미연결) 상태의 폴백 배는 임시 id를 가지지만 동일한 시각 경로를 따른다.
   *
   * @param {string} text 배에 실을 텍스트
   * @param {string} [messageId] 서버가 부여한 UUID (없으면 로컬 임시 id 생성)
   */
  const addBoat = useCallback(
    (text, messageId) => {
      const sequence = nextBoatId.current;
      nextBoatId.current += 1;

      const boat = {
        id: messageId ?? `local-${sequence}`,
        text,
        // 냥캣 여부는 클라이언트에서 직접 판별한다.
        // 서버 수정 없이 모든 시청자가 동시에 냥캣을 보게 하기 위함.
        isNyan: /냥|nyan|야옹/i.test(text),
        lane: (sequence % 5) * 4 - 8,
        scale: 0.72 + (sequence % 3) * 0.045,
        drift: sequence % 2 === 0 ? -3 : 4,
      };

      setBoats((currentBoats) => [...currentBoats, boat]);
      const timerId = window.setTimeout(() => removeBoat(boat.id), boatLifetimeMs);
      timersRef.current.push(timerId);
    },
    [removeBoat],
  );

  const handleLaunchBoat = useCallback(() => {
    const text = worryText.trim();
    if (!text) return;

    const sceneCommand = sceneCommands.get(text);
    if (sceneCommand) {
      setManualScene(sceneCommand);
      setWorryText("");
      return;
    }

    if (isRateLimited) return;

    const now = Date.now();

    // 슬라이딩 윈도우: 1초 이상 지난 타임스탬프 제거
    sendTimestampsRef.current = sendTimestampsRef.current.filter(
      (t) => now - t < clientRateLimitWindowMs,
    );

    if (sendTimestampsRef.current.length >= clientRateLimitMax) {
      setIsRateLimited(true);
      // 윈도우에서 가장 오래된 타임스탬프가 만료될 때 재활성화
      const oldest = sendTimestampsRef.current[0];
      const resetDelay = clientRateLimitWindowMs - (now - oldest) + 20;
      window.clearTimeout(rateLimitTimerRef.current);
      rateLimitTimerRef.current = window.setTimeout(() => {
        setIsRateLimited(false);
      }, resetDelay);
      return;
    }

    sendTimestampsRef.current.push(now);

    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "boat:add", text }));
    } else {
      addBoat(text);
    }

    setWorryText("");
  }, [addBoat, isRateLimited, worryText]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      window.clearTimeout(rateLimitTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let shouldReconnect = true;

    /**
     * WebSocket 채널을 열고 서버 소유 카운터(오늘 배 수, 시청자 수)를 동기화한다.
     * 연결이 끊기면 1.5초 후 자동 재연결한다.
     */
    const connect = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "boat:add" && typeof message.text === "string") {
            addBoat(message.text, message.id);
            if (Number.isFinite(message.todayCount)) {
              setTodayBoatCount(message.todayCount);
            }
            return;
          }

          if (message.type === "boat:count" && Number.isFinite(message.count)) {
            setTodayBoatCount(message.count);
            return;
          }

          if (message.type === "viewer:count" && Number.isFinite(message.count)) {
            setViewerCount(message.count);
          }
        } catch {
          // 잘못된 형식의 실시간 메시지는 무시한다.
        }
      });

      socket.addEventListener("close", () => {
        if (!shouldReconnect) return;
        reconnectTimerRef.current = window.setTimeout(connect, 1500);
      });
    };

    connect();

    return () => {
      shouldReconnect = false;
      window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
    };
  }, [addBoat]);

  return (
    <main className={`app-shell scene-${dominantScene}`} style={sceneStyle}>
      <div className="scene-sky scene-sky-day" aria-hidden="true" />
      <div className="scene-sky scene-sky-twilight" aria-hidden="true" />
      <div className="scene-sky scene-sky-night" aria-hidden="true" />
      <SoundToggle
        channels={[
          { id: "ambience", label: "엠비언스", src: ambienceSrc, volume: 0.55 },
          { id: "music", label: "음악", src: musicSrc, volume: 0.38 },
        ]}
        todayCount={todayBoatCount}
        viewerCount={viewerCount}
        isManualScene={isManualScene}
        onUseTimeScene={() => setManualScene(null)}
      />
      <SkySection
        worryText={worryText}
        setWorryText={setWorryText}
        canSend={worryText.trim().length > 0 && !isRateLimited}
        onSend={handleLaunchBoat}
      />
      <RiverSection boats={boats} sceneLayers={sceneLayers} />
    </main>
  );
}

export default App;
