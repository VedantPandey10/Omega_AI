import { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/api";
import { Message } from "../types/chat";
import FaceTracker from "./FaceTracker";
import VirtualKeyboard from "./VirtualKeyboard";


export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: "Hello! I'm Omega 🤖" }
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isClicking, setIsClicking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const send = async () => {
    if (!text.trim() || loading) return;

    setMessages(m => [...m, { from: "user", text }]);
    setText("");
    setLoading(true);

    try {
      const res = await sendMessage(text);
      setMessages(m => [...m, { from: "bot", text: res.data.reply }]);
    } catch {
      setMessages(m => [
        ...m,
        { from: "bot", text: "⚠️ Backend not reachable." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVirtualKeyPress = (key: string) => {
    if (key === "⌫") {
      setText(prev => prev.slice(0, -1));
    } else if (key === "enter") {
      send();
    } else {
      setText(prev => prev + key);
    }
  };

  const lastBlinkRef = useRef<number>(0);

  const handleBlink = () => {
    const now = Date.now();
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 200);

    // Double Blink Detection (within 500ms)
    if (now - lastBlinkRef.current < 500) {
      send();
      lastBlinkRef.current = 0; // Reset
      return;
    }

    // Update last blink time
    lastBlinkRef.current = now;

    // Single Blink Logic
    if (hoveredKey) {
      handleVirtualKeyPress(hoveredKey);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  return (
    <>
      <header className="header">
        <span>Omega AI 🤖</span>
      </header>

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.from}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="thinking">Omega is thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      {showCamera && (
        <>
          <FaceTracker
            onCoords={(x, y) => setCursor({ x: x * window.innerWidth, y: y * window.innerHeight })}
            onBlink={handleBlink}
          />

          <VirtualKeyboard
            cursor={cursor}
            active={showCamera}
            onKeyPress={handleVirtualKeyPress}
            onHoverKey={setHoveredKey}
          />

          <div
            className={`virtual-cursor ${isClicking ? 'clicking' : ''}`}
            style={{
              left: `${cursor.x}px`,
              top: `${cursor.y}px`
            }}
          />
        </>
      )}

      <div className="input-area">
        <button className="toggle-camera" onClick={() => setShowCamera(!showCamera)}>
          {showCamera ? "📷 Off" : "📷 On"}
        </button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Type a message..."
        />
        <button ref={sendButtonRef} onClick={send}>Send</button>
      </div>
    </>
  );
}

