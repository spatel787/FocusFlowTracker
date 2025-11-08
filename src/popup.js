import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { blocked_get, blocked_add, blocked_remove } from "./storage.js";
import "./popup.css";


const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return "Loading...";
  }
};

const truncateString = (str, maxLength) => {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
};

// ---------------- Focus Tracker ----------------
function FocusTracker() {
  const [isExtensionActive, setIsExtensionActive] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [currentTab, setCurrentTab] = useState("Loading...");
  const [time, setTime] = useState(0);
  const [tabTime, setTabTime] = useState(0);
  const [distractionWarnings, setDistractionWarnings] = useState(0);

  useEffect(() => {
    // On load, get current tab and status
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

      chrome.storage.session.get(
        ["isExtensionActive", "StartTime", "StopTime", "tabStartTimes", "tabStopTimes"],
        (res) => {
          setIsExtensionActive(res.isExtensionActive !== false);
          
          if (res.StartTime && !res.StopTime) {
            setTime(Date.now() - res.StartTime);
          } else if (res.StartTime && res.StopTime) {
            setTime(res.StopTime - res.StartTime);
          }

          // Per-tab timers
          const starts = res.tabStartTimes || {};
          const stops = res.tabStopTimes || {};
          const start = starts[currentTab];
          const stop = stops[currentTab];
          if (start && !stop) {
            setTabTime(Date.now() - start);
          } else if (start && stop) {
            setTabTime(stop - start);
          }
        }
      );
    }
  }, [currentTab]);

  useEffect(() => {
    let intervalId;
    if (isExtensionActive) {
      intervalId = setInterval(() => {
        setTime((t) => t + 10);
        
        // Update current tab timer
        chrome.storage.session.get(["tabStartTimes", "tabStopTimes"], (res) => {
          const starts = res.tabStartTimes || {};
          const stops = res.tabStopTimes || {};
          const start = starts[currentTab];
          const stop = stops[currentTab];
          if (start && !stop) {
            setTabTime(Date.now() - start);
          }
          //chrome.storage.sync.set({ StopTime: stopTime });
        });
      }, 10);
    }
    return () => clearInterval(intervalId);
  }, [isExtensionActive, currentTab]);

  const toggleTracking = () => {
    const messageType = isExtensionActive ? "STOP_TRACKING" : "START_TRACKING";
    const newIsExtensionActive = !isExtensionActive;

    chrome.runtime.sendMessage({ type: messageType }, (response) => {
      if (response && response.success) {
        setIsExtensionActive(newIsExtensionActive);
        if (newIsExtensionActive) {
          setTabSwitches(0);
          setTime(0);
        }
      }
    });

    // Update storage
    chrome.storage.session.set({ isExtensionActive: newIsExtensionActive });

    if (newIsExtensionActive) {
      // Starting tracking
      chrome.storage.session.set({ 
        StartTime: Date.now() - time, 
        StopTime: null 
      });
      chrome.storage.sync.set({ 
        StartTime: Date.now() - time, 
        StopTime: null 
      });
      chrome.storage.session.get(["tabStartTimes", "tabStopTimes"], (res) => {
        const starts = res.tabStartTimes || {};
        const stops = res.tabStopTimes || {};
        starts[currentTab] = Date.now() - tabTime;
        stops[currentTab] = null;
        chrome.storage.session.set({ tabStartTimes: starts, tabStopTimes: stops });
        chrome.storage.local.set({ tabStartTimes: starts, tabStopTimes: stops });
      });
    } else {
      // Stopping tracking
      chrome.storage.session.get(["StartTime"], (res) => {
        const stopTime = (res.StartTime || 0) + time;
        chrome.storage.session.set({ StopTime: stopTime });
        chrome.storage.sync.set({ StopTime:  stopTime });
      });
      
      // Stop current tab timer
      chrome.storage.session.get(["tabStopTimes"], (res) => {
        const stops = res.tabStopTimes || {};
        stops[currentTab] = Date.now();
        chrome.storage.session.set({ tabStopTimes: stops });
        chrome.storage.local.set({ tabStopTimes: stops });
      });
    }
  };


  const formatTime = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="card">

        {/* Distraction Score */}
        <DistractionScore
          time={time}
          tabSwitches={tabSwitches}
          distractionWarnings={distractionWarnings}
        />

        <button
          onClick={toggleTracking}
          className={isExtensionActive ? "red" : "green"}
        >        
          {isExtensionActive ? "Stop" : "Start"}
        </button>

        <timer>{formatTime(time)}</timer>
        
      </div>
    </div>
  );
}

// ---------------- Distraction Score ----------------
function DistractionScore({ time, tabSwitches, distractionWarnings }) {
  const timeMinutes = Math.max(time / 60000, 0.1);
  const a = 0.25;
  const b = 3;
  const score = Math.round(
    100 * (timeMinutes / (timeMinutes + (a * tabSwitches + b * distractionWarnings)))
  );

  let color = "#4caf50";
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
          <span className="score-label" style={{ color }}>
            {label}
          </span>
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
    justifyContent: "center",
  };

  return (
    <div
      style={{
        marginTop: "10px",
        display: "flex",
        gap: "17px",
        flex: 1,
        justifyContent: "center",
      }}
    >
      <button onClick={() => openPage("blocker")} style={buttonStyle}>
        <svg fill={(theme === "dark" ? "#ffffff" : "#000000")} width="20px" height="20px" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg"><path d="M500 930q-117 0-217-59-97-57-154-154-59-100-59-217t59-217q57-97 154-154 100-59 217-59t217 59q97 57 154 154 59 100 59 217t-59 217q-57 97-154 154-100 59-217 59zM320 760q39 28 85.5 42.5T500 817q86 0 160-44 71-42 113-113 44-74 44-160 0-48-14.5-94.5T760 320zm180-577q-86 0-160 44-71 42-113 113-44 74-44 160 0 48 14.5 94.5T240 680l440-440q-39-28-85.5-42.5T500 183z"/></svg>
      </button>
      <button onClick={() => openPage("notes")} style={buttonStyle}>
        <svg width="20px" height="20px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke={(theme === "dark" ? "#ffffff" : "#000000")} stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
        <polyline points="7.25 14.25,2.75 14.25,2.75 1.75,13.25 1.75,13.25 9.25"/>
        <path d="m9.75 12.75 1.5 1.5 3-2.5m-8.5-4h4.5m-4.5 3h1.5m-1.5-6h4.5"/>
        </svg>
      </button>
      <button onClick={() => openPage("stats")} style={buttonStyle}>
        <svg fill={(theme === "dark" ? "#ffffff" : "#000000")} width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path id="stats1" class="cls-1" d="M1091,264h-22a1,1,0,0,1-1-1V241a1,1,0,0,1,2,0v21h21A1,1,0,0,1,1091,264Zm-5-4a1,1,0,0,1-1-1V248a1,1,0,0,1,2,0v11A1,1,0,0,1,1086,260Zm-4,0h0a1,1,0,0,1-1-1v-7a1,1,0,0,1,1-1h0a1,1,0,0,1,1,1v7A1,1,0,0,1,1082,260Zm-4,0a1,1,0,0,1-1-1V243a1,1,0,0,1,2,0v16A1,1,0,0,1,1078,260Zm-4,0a1,1,0,0,1-1-1V249a1,1,0,0,1,2,0v10A1,1,0,0,1,1074,260Z" transform="translate(-1068 -240)"/>
        </svg>
      </button>
    </div>
  );
}

// ---------------- Main App ----------------
function MainApp() {
  const [theme, setTheme] = React.useState(null);
  const [currentTab, setCurrentTab] = useState("Loading...");

  React.useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.get("theme", (result) => {
        setTheme(result.theme || "light");
      });
    } else {
      setTheme("light");
    }
  }, []);

  
  React.useEffect(() => {
    // On load, get current tab and status
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) setCurrentTab(tabs[0].url);
      });
    }
  }, []);

  React.useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ theme });
      }
    }
  }, [theme]);

  if (!theme) return null;

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="header-title">{truncateString(getDomain(currentTab), 15)}</h1>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div className="content">
        <FocusTracker />
        <PageButtons theme={theme} />
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<MainApp />);
