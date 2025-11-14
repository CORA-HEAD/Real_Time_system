import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./index.css";

const SERVER_URL = "http://localhost:5000";

export default function App() {
  const socket = useRef(null);

  const [currentTurn, setCurrentTurn] = useState("");
  const [queue, setQueue] = useState([]);

  const [eventLogo, setEventLogo] = useState("");   // Dynamic logo
  const [eventTitle, setEventTitle] = useState(""); // Dynamic title

  const soundRef = useRef(null);

  useEffect(() => {
    socket.current = io(SERVER_URL, {
      transports: ["websocket"],
    });

    // ---- TURN UPDATE ----
    socket.current.on("turn-update", (name) => {
      setCurrentTurn(name);

      // Play sound
      if (soundRef.current) {
        soundRef.current.currentTime = 0;
        soundRef.current.play();
      }

      // Animation
      const element = document.getElementById("nameBox");
      if (element) {
        element.classList.remove("fadeIn");
        void element.offsetWidth;
        element.classList.add("fadeIn");
      }
    });

    // ---- QUEUE UPDATE ----
    socket.current.on("queue-update", (list) => setQueue(list));

    // ---- BRANDING UPDATE ----
    socket.current.on("logo-update", (logo) => setEventLogo(logo));
    socket.current.on("title-update", (title) => setEventTitle(title));

    return () => socket.current.disconnect();
  }, []);

  return (
    <div className="viewer-container">

      {/* SOUND */}
      <audio ref={soundRef} src="/ding.mp3"></audio>

      {/* HEADER */}
      <div className="header">
        {eventLogo && (
          <img src={eventLogo} alt="Event Logo" className="logo" />
        )}

        <h1 className="event-title">
          {eventTitle || "Event Title Loading..."}
        </h1>
      </div>

      {/* CURRENT NAME */}
      <div id="nameBox" className="name-box fadeIn">
        {currentTurn || "WAITING..."}
      </div>

      {/* QUEUE */}
      <div className="queue-section">
        <h2>Upcoming</h2>

        {queue.length === 0 ? (
          <p className="empty">No one in queue</p>
        ) : (
          <ul>
            {queue.map((n, i) => (
              <li key={i}>{i + 1}. {n}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
