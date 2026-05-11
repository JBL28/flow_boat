import { useCallback, useEffect, useRef, useState } from "react";
import SkySection from "./components/SkySection.jsx";
import RiverSection from "./components/RiverSection.jsx";
import SoundToggle from "./components/SoundToggle.jsx";
import ambienceSrc from "../resources/sound/ambience.mp3";
import musicSrc from "../resources/sound/song.mp3";

function getTodayKey() {
  return `flow_boat_count_${new Date().toISOString().slice(0, 10)}`;
}
function readTodayCount() {
  try { return Number(localStorage.getItem(getTodayKey()) ?? 0); } catch { return 0; }
}
function writeTodayCount(n) {
  try { localStorage.setItem(getTodayKey(), String(n)); } catch {}
}

const boatLifetimeMs = 49500;
// || (not ??) so that VITE_WS_URL="" also falls through to the auto-derived URL.
// window.location.host includes the port for non-standard ports, which is correct
// behind the Nginx proxy where /ws is on the same origin as the page.
const wsUrl =
  import.meta.env.VITE_WS_URL ||
  `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`;

// Client-side rate limit: max 3 sends per second (mirrors server rule)
const clientRateLimitWindowMs = 1000;
const clientRateLimitMax = 3;

function App() {
  const [boats, setBoats] = useState([]);
  const [worryText, setWorryText] = useState("");
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [todayBoatCount, setTodayBoatCount] = useState(() => readTodayCount());
  const nextBoatId = useRef(0);
  const timersRef = useRef([]);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const sendTimestampsRef = useRef([]);
  const rateLimitTimerRef = useRef(null);

  const removeBoat = useCallback((boatId) => {
    setBoats((currentBoats) => currentBoats.filter((boat) => boat.id !== boatId));
  }, []);

  const addBoat = useCallback(
    (text, messageId) => {
      const sequence = nextBoatId.current;
      nextBoatId.current += 1;

      const boat = {
        id: messageId ?? `local-${sequence}`,
        text,
        lane: (sequence % 5) * 4 - 8,
        scale: 0.72 + (sequence % 3) * 0.045,
        drift: sequence % 2 === 0 ? -3 : 4,
      };

      setBoats((currentBoats) => [...currentBoats, boat]);
      const timerId = window.setTimeout(() => removeBoat(boat.id), boatLifetimeMs);
      timersRef.current.push(timerId);

      setTodayBoatCount(() => {
        const next = readTodayCount() + 1;
        writeTodayCount(next);
        return next;
      });
    },
    [removeBoat],
  );

  const handleLaunchBoat = useCallback(() => {
    const text = worryText.trim();
    if (!text || isRateLimited) return;

    const now = Date.now();

    // Sliding window: drop timestamps older than 1 second
    sendTimestampsRef.current = sendTimestampsRef.current.filter(
      (t) => now - t < clientRateLimitWindowMs,
    );

    if (sendTimestampsRef.current.length >= clientRateLimitMax) {
      setIsRateLimited(true);
      // Re-enable when the oldest timestamp in the window expires
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

    const connect = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "boat:add" && typeof message.text === "string") {
            addBoat(message.text, message.id);
          }
        } catch {
          // Ignore malformed realtime messages.
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
    <main className="app-shell">
      <SoundToggle
        channels={[
          { id: "ambience", label: "엠비언스", src: ambienceSrc, volume: 0.55 },
          { id: "music", label: "음악", src: musicSrc, volume: 0.38 },
        ]}
        todayCount={todayBoatCount}
      />
      <SkySection
        worryText={worryText}
        setWorryText={setWorryText}
        canSend={worryText.trim().length > 0 && !isRateLimited}
        onSend={handleLaunchBoat}
      />
      <RiverSection boats={boats} />
    </main>
  );
}

export default App;
