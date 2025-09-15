import { useState, useEffect } from "react";

export default function App() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          clearInterval(interval);
          setIsActive(false);
          alert("⏰ Time’s up! Take a break!");
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const startTimer = () => setIsActive(true);
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "Arial" }}>
      <h1>Focus Timer</h1>
      <h2>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </h2>
      <div style={{ marginTop: "10px" }}>
        {!isActive ? (
          <button onClick={startTimer} style={{ marginRight: "10px" }}>
            ▶ Start
          </button>
        ) : (
          <button onClick={() => setIsActive(false)} style={{ marginRight: "10px" }}>
            ⏸ Pause
          </button>
        )}
        <button onClick={resetTimer}>🔄 Reset</button>
      </div>
    </div>
  );
}
