import React, { useState, useEffect } from "react";
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

  let tabStartTimes = {};
  let tabStopTimes = {}

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
        tabStartTimes = res.tabStartTimes || {};
        tabStopTimes = res.tabStopTimes || {};
        if (tabStartTimes[currentTab] && !tabStopTimes[currentTab]) {
          setTabTime(Date.now() - tabStartTimes[currentTab]);
        }
        else if (tabStartTimes[currentTab] && tabStopTimes[currentTab]) {
          setTabTime(tabStopTimes[currentTab] - tabStartTimes[currentTab]);
        }
      });
    }
  }, []);

  useEffect(() => {
    let intervalId;
    if (isExtensionActive) {
      intervalId = setInterval(() => setTime((t) => t + 10), 10);
      intervalId = setInterval(() => setTabTime((t) => t + 10), 10);
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
      tabStartTimes[currentTab] = Date.now() - tabTime;
      tabStopTimes[currentTab] = null;
      chrome.storage.session.set({ tabStartTimes: tabStartTimes, tabStopTimes: tabStopTimes});
    }
    else {
      chrome.storage.session.get(["StartTime"], (res) => {
        chrome.storage.session.set({ StopTime: res.StartTime + time });
        tabStartTimes[currentTab] = null;
        tabStopTimes[currentTab] = Date.now();
        chrome.storage.session.set({ tabStartTimes: tabStartTimes, tabStopTimes: tabStopTimes});
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

<<<<<<< HEAD
  const tabHours = Math.floor(tabTime / 3600000);
  const tabMinutes = Math.floor((tabTime % 3600000) / 60000);
  const tabSeconds = Math.floor((tabTime % 60000) / 1000);

=======
  /*Focus Flow Tracker Info*/
>>>>>>> 7a26c68 (UI/UX improvements to FocusTracker popup, Blocked sites, and Statistics)
  return (
    <div className="card">
      <h2>{getDomain(currentTab)}</h2>
      <div className={`status ${isExtensionActive ? "active" : "inactive"}`}>
<<<<<<< HEAD
        <p>Status: {isExtensionActive ? "TRACKING" : "INACTIVE"}</p>
        <p className="stopwatch-time">
          {hours.toString().padStart(2, "0")}:
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </p>
        <p>Tab Switches: {tabSwitches}</p>
        <p>Distraction Warnings: {distractionWarnings}</p> 
=======
>>>>>>> 7a26c68 (UI/UX improvements to FocusTracker popup, Blocked sites, and Statistics)
        <p>
          <strong>Tab Switches:</strong> {tabSwitches}
        </p>
        <p>
          <strong>Distraction Warnings:</strong> {distractionWarnings}
        </p> 
        <p className="stopwatch-time">
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

// ---------------- Theme Toggle ----------------
function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="toggle-btn"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      style={{ marginLeft: "auto" }}
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
      <div className="header" style={{ display: "flex", alignItems: "center" }}>
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

