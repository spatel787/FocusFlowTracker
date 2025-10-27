import React, { useState, useEffect, use } from "react";
import ReactDOM from "react-dom/client";
import { blocked_get, blocked_add, blocked_remove } from "./storage.js";
import "./popup.css";

// ---------------- Focus Tracker ----------------
function FocusTracker() {
  const [isExtensionActive, setIsExtensionActive] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [currentTab, setCurrentTab] = useState("Loading...");
  const [time, setTime] = useState(0);
  const [tabTime, setTabTime] = useState(0);
  const [distractionWarnings, setDistractionWarnings] = useState(0);

  useEffect(() => {//On load, get current tab and status
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) setCurrentTab(tabs[0].url);
      });
    }

    if (typeof chrome !== "undefined" && chrome.runtime) {
      chrome.runtime.sendMessage({ type: "GET_STATUS" }, (response) => {
        if (response) {
          setIsExtensionActive(response.isTracking || false);
          setTabSwitches(response.tabSwitches || 0);
          setDistractionWarnings(response.distractionWarnings || 0); 
        }
      });
      chrome.storage.session.get(["isExtensionActive", "StartTime", "StopTime", "tabStartTimes", "tabStopTimes"], (res) => {
        setIsExtensionActive(res.isExtensionActive || false);
        if (res.StartTime && !res.StopTime) setTime(Date.now() - res.StartTime);
        else if (res.StartTime && res.StopTime) setTime(res.StopTime - res.StartTime);

        // Per-tab timers
        const starts = res.tabStartTimes || {};
        const stops = res.tabStopTimes || {};
        const start = starts[currentTab];
        const stop = stops[currentTab];
        if (start && !stop) setTabTime(Date.now() - start);
        else if (start && stop) setTabTime(stop - start);
        else setTabTime(0);
      });
    }
  }, []);

  useEffect(() => {
    let intervalId;
    if (isExtensionActive) {
      intervalId = setInterval(() =>  {
        setTime((t) => t + 10);

        // Update current tab timer
        chrome.storage.session.get(["tabStartTimes", "tabStopTimes"], (res) => {
          const starts = res.tabStartTimes || {};
          const stops = res.tabStopTimes || {};
          const start = starts[currentTab];
          const stop = stops[currentTab];
          if (start && !stop) setTabTime(Date.now() - start);
      });
      }, 10);
    }
    return () => clearInterval(intervalId);
  }, [isExtensionActive]);

  const toggleTracking = () => {
    const messageType = isExtensionActive ? "STOP_TRACKING" : "START_TRACKING";
    chrome.runtime.sendMessage({ type: messageType }, (response) => {
      if (response && response.success) {
        setIsExtensionActive(!isExtensionActive);
        if (!isExtensionActive) setTabSwitches(0);
      }
    });
    const newIsExtensionActive = !isExtensionActive;
    setIsExtensionActive(newIsExtensionActive);
    chrome.storage.session.set({ isExtensionActive: newIsExtensionActive });
    if (newIsExtensionActive) {
      chrome.storage.session.set({ StartTime: Date.now() - time, StopTime: null });
      chrome.storage.session.get(["tabStartTimes", "tabStopTimes"], (res) => {
        const starts = res.tabStartTimes || {};
        const stops = res.tabStopTimes || {};
        starts[currentTab] = Date.now() - tabTime;
        stops[currentTab] = null;
        chrome.storage.session.set({ tabStartTimes: starts, tabStopTimes: stops });
      });
    }
    else {
      chrome.storage.session.get(["StartTime"], (res) => {
        chrome.storage.session.set({ StopTime: res.StartTime + time });
      });
      // Stop current tab timer
      chrome.storage.session.get(["tabStartTimes", "tabStopTimes"], (res) => {
        const stops = res.tabStopTimes || {};
        stops[currentTab] = Date.now();
        chrome.storage.session.set({ tabStopTimes: stops });
      });
    }
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "Loading...";
    }
  };

  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  
  const tabHours = Math.floor(tabTime / 3600000);
  const tabMinutes = Math.floor((tabTime % 3600000) / 60000);
  const tabSeconds = Math.floor((tabTime % 60000) / 1000);
  /*Focus Flow Tracker Info*/
  return (
    <div className="card">
      <h2>{getDomain(currentTab)}</h2>
      <div className={`status ${isExtensionActive ? "active" : "inactive"}`}>
        <p>
          <strong>Tab Switches:</strong> {tabSwitches}
        </p>
        <p>
          <strong>Distraction Warnings:</strong> {distractionWarnings}
        </p> 

             {/* Distraction Score */}
        <DistractionScore
          time={time}
          tabSwitches={tabSwitches}
          distractionWarnings={distractionWarnings}
        />
        
        <p className="stopwatch-time">
          <strong>Total Time: </strong>
          {hours.toString().padStart(2, "0")}:
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
          </p>
          <p className="stopwatch-time">
          <strong>Tab Time: </strong>
          {tabHours.toString().padStart(2, "0")}:
          {tabMinutes.toString().padStart(2, "0")}:
          {tabSeconds.toString().padStart(2, "0")}
        </p>
        <button onClick={toggleTracking} className={isExtensionActive ? "red" : "green"}>
          {isExtensionActive ? "Stop" : "Start"} Tracking
        </button>
      </div>
    </div>
  );
}

// ---------------- Distraction Score ----------------
function DistractionScore({ time, tabSwitches, distractionWarnings }) {
  // Convert ms → minutes for scoring
  const timeMinutes = Math.max(time / 60000, 0.1);

  const a = 1; // weight for tab switches
  const b = 3; // weight for warnings
  const score = Math.round(100 * (timeMinutes / (timeMinutes + (a * tabSwitches + b * distractionWarnings))));

  let color = "#4caf50"; // default good
  let label = "Good";
  if (score < 60) {
    color = "#f44336";
    label = "Bad";
  } else if (score < 80) {
    color = "#ffb300";
    label = "Okay";
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="distraction-score">
      <h3>Distraction Score</h3>
      <div className="circle">
        <svg width="120" height="120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#e0e0e0"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
          />
        </svg>
        <div className="score-text">
          <span className="score-number">{score}</span>
          <span className="score-label" style={{ color }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------- Theme Toggle ----------------
function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="toggle-btn"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      {"☼"}
    </button>
  );
}

// ---------------- Page Buttons ----------------
function PageButtons({ theme }) {
  const openPage = (page) => {
    const url = chrome.runtime.getURL(`${page}.html`);
    window.open(url, "_blank");
  };

  const buttonStyle = {
    padding: "12px 20px",
    fontSize: "15px",
    backgroundColor: theme === "dark" ? "#1e1e1e" : "#fafafa",
    color: theme === "dark" ? "#fff" : "#000",
    border: "2px solid",
    borderColor: theme === "dark" ? "#353535" : "#e5e5e5",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center"
  };

  return (
    <div style={{ display: "flex", flexDirection: "center", gap: "10px", marginTop: "20px", marginBottom: "20px", marginLeft: "5px", marginRight: "5px" }}>
      <button onClick={() => openPage("blocker")} style={buttonStyle}>
        Blocked Sites
      </button>
      <button onClick={() => openPage("notes")} style={buttonStyle}>
        Open Notes
      </button>
      {/* Statistics button*/}
      <button onClick={() => openPage("stats")} style={buttonStyle}>
        View Statistics
      </button>
    </div>
  );
}

// ---------------- Main App ----------------
function MainApp() {
  const [theme, setTheme] = React.useState(null); // start as null to wait for storage

  // Load theme from Chrome storage whenever popup opens
  React.useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get("theme", (result) => {
        setTheme(result.theme || "light");
      });
    } else {
      setTheme("light");
    }
  }, []);

  // Apply theme immediately when it changes
  React.useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ theme });
      }
    }
  }, [theme]);

  if (!theme) return null; // don’t render until theme loaded

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="header-title">Focus Flow Tracker</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div className="content">
        <FocusTracker />
        <PageButtons theme={theme} />
      </div>
    </div>
  );
}

// ---------------- Render ----------------
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<MainApp />);
