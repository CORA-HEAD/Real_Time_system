import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./index.css";

const SERVER_URL = "http://localhost:5000";

export default function Admin() {
  const socket = useRef(null);

  const [queue, setQueue] = useState([]);
  const [currentTurn, setCurrentTurn] = useState("");
  const [newName, setNewName] = useState("");

  // BRANDING STATES
  const [eventTitle, setEventTitle] = useState("My Event");
  const [eventLogo, setEventLogo] = useState(""); // base64 image

  useEffect(() => {
    socket.current = io(SERVER_URL);

    socket.current.on("queue-update", (list) => setQueue(list));
    socket.current.on("turn-update", (name) => setCurrentTurn(name));

    socket.current.on("branding-update", (data) => {
      if (data.title) setEventTitle(data.title);
      if (data.logo) setEventLogo(data.logo);
    });

    return () => socket.current.disconnect();
  }, []);

  // ---- HANDLE IMAGE UPLOAD ----
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setEventLogo(reader.result); // Base64 string
    };

    reader.readAsDataURL(file);
  };

  const updateBranding = () => {
    socket.current.emit("branding-update", {
      title: eventTitle,
      logo: eventLogo, // Base64
    });
  };

  const addToQueue = () => {
    if (!newName.trim()) return alert("Enter name");

    socket.current.emit("queue-add", newName);
    setNewName("");
  };

  const removeFromQueue = (name) => {
    socket.current.emit("queue-remove", name);
  };

  const setTurn = (name) => {
    socket.current.emit("set-turn", name);
    socket.current.emit("queue-remove", name);
  };

  const showWaiting = () => {
    socket.current.emit("set-turn", "WAITING");
  };

  const nextPerson = () => {
    socket.current.emit("queue-next");
  };

  const clearQueue = () => {
    socket.current.emit("queue-clear");
  };

  return (
    <div className="admin-container">

      {/* TOP BRANDING DISPLAY */}
      <div className="top-branding">
        {eventLogo && (
          <img src={eventLogo} alt="Event Logo" className="event-logo" />
        )}
        <h1>{eventTitle}</h1>
      </div>

      {/* BRANDING SETTINGS */}
      <div className="branding-section">
        <h2>Branding Settings</h2>

        <input
          type="text"
          placeholder="Enter Event Title"
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />

        {/* FILE UPLOAD */}
        <input type="file" accept="image/*" onChange={handleLogoUpload} />

        {eventLogo && (
          <img
            src={eventLogo}
            alt="Preview"
            className="preview-logo"
            style={{
              width: "120px",
              marginTop: "10px",
              borderRadius: "10px",
            }}
          />
        )}

        <button onClick={updateBranding}>Update Branding</button>
      </div>

      {/* CURRENT TURN */}
      <div className="current-turn-box">
        Current Turn: <span className="highlight">{currentTurn || "None"}</span>
      </div>

      {/* ADD NEW PERSON — WITH ENTER KEY SUPPORT */}
      <div className="add-section">
        <form
          onSubmit={(e) => {
            e.preventDefault(); // prevent page reload
            addToQueue();
          }}
        >
          <input
            type="text"
            placeholder="Enter name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      </div>

      {/* QUEUE LIST */}
      <h2>Queue</h2>
      <div className="queue-box">
        {queue.length === 0 ? (
          <p>No one in queue</p>
        ) : (
          queue.map((name, index) => (
            <div key={index} className="queue-item">
              <span>{index + 1}. {name}</span>

              <div className="actions">
                <button onClick={() => setTurn(name)}>Set Turn</button>
                <button onClick={() => removeFromQueue(name)}>Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CONTROLS */}
      <div className="controls">
        <button onClick={nextPerson}>Next Person</button>

        <button style={{ background: "#888" }} onClick={showWaiting}>
          Show Waiting Screen
        </button>

        <button onClick={clearQueue} style={{ background: "red" }}>
          Clear Queue
        </button>
      </div>
    </div>
  );
}
