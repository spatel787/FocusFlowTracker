import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { blocked_get, blocked_add, blocked_remove } from "./storage.js";
import "./popup.css";

// ---------------- Focus Tracker ----------------
function FocusTracker() {
  const [isExtensionActive, setIsExtensionActive] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [currentTab, setCurrentTab] = useState("Loading...");

  useEffect(() => {
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
        }
      });
    }
  }, []);

  const toggleTracking = () => {
    const messageType = isExtensionActive ? "STOP_TRACKING" : "START_TRACKING";
    chrome.runtime.sendMessage({ type: messageType }, (response) => {
      if (response && response.success) {
        setIsExtensionActive(!isExtensionActive);
        if (!isExtensionActive) setTabSwitches(0);
      }
    });
  };

  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return "Loading...";
    }
  };

  return (
    <div className="card">
      <h2>Focus Flow Tracker</h2>
      <div className={`status ${isExtensionActive ? "active" : "inactive"}`}>
        <p>Status: {isExtensionActive ? "TRACKING" : "INACTIVE"}</p>
        <p>Tab Switches: {tabSwitches}</p>
        <p>
          <strong>Current Site:</strong> {getDomain(currentTab)}
        </p>
        <button onClick={toggleTracking} className={isExtensionActive ? "red" : "green"}>
          {isExtensionActive ? "Stop" : "Start"} Tracking
        </button>
      </div>
    </div>
  );
}

// ---------------- Site Blocker ----------------
function SiteBlocker() {
  const [blockedSites, setBlockedSites] = useState([]);
  const [newSite, setNewSite] = useState("");

  useEffect(() => {
    const fetchSites = async () => {
      const sites = await blocked_get();
      if (sites && sites.length > 0) setBlockedSites(sites);
    };
    fetchSites();
  }, []);

  const addSite = async () => {
    const siteToAdd = newSite.trim();
    if (!siteToAdd || blockedSites.includes(siteToAdd)) return;

    await blocked_add(siteToAdd);
    setBlockedSites([...blockedSites, siteToAdd]);
    setNewSite("");
  };

  const removeSite = async (siteToRemove) => {
    await blocked_remove(siteToRemove);
    setBlockedSites(blockedSites.filter((s) => s !== siteToRemove));
  };

  return (
    <div className="card">
      <h2>Site Blocker</h2>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          type="text"
          value={newSite}
          placeholder="example.com"
          onChange={(e) => setNewSite(e.target.value)}
          style={{ flex: 1, padding: "5px" }}
        />
        <button onClick={addSite} className="green">
          Block
        </button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {blockedSites.map((site) => (
          <li key={site} className="list-item">
            <button onClick={() => removeSite(site)} className="gray">
              Remove
            </button>
            <span> {site}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- Time Tracker ----------------
function TimeTracker() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.session.get(["isRunning", "StartTime", "StopTime"], (res) => {
        setIsRunning(res.isRunning || false);
        if (res.StartTime && !res.StopTime) setTime(Date.now() - res.StartTime);
        else if (res.StartTime && res.StopTime) setTime(res.StopTime - res.StartTime);
      });
    }
  }, []);

  useEffect(() => {
    let intervalId;
    if (isRunning) intervalId = setInterval(() => setTime((t) => t + 10), 10);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  const startAndStop = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    chrome.storage.session.set({ isRunning: newIsRunning });
    if (newIsRunning) chrome.storage.session.set({ StartTime: Date.now() - time, StopTime: null });
    else chrome.storage.session.get(["StartTime"], (res) => {
      chrome.storage.session.set({ StopTime: res.StartTime + time });
    });
  };

  const reset = () => {
    setTime(0);
    chrome.storage.session.set({ StartTime: isRunning ? Date.now() : null, StopTime: null });
  };

  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  return (
    <div className="card stopwatch-container">
      <h2>Session Timer</h2>
      <p className="stopwatch-time">
        {hours.toString().padStart(2, "0")}:
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </p>
      <div className="stopwatch-buttons">
        <button onClick={startAndStop} className={`stopwatch-button ${isRunning ? "red" : "green"}`}>
          {isRunning ? "Stop" : "Start"}
        </button>
        <button onClick={reset} className="stopwatch-button gray">
          Reset
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
      {theme === "light" ? "☼" : "☾"}
    </button>
  );
}

// ---------------- Notes Button ----------------
function NotesButton({ theme }) {
  const openNotes = () => {
    const url = chrome.runtime.getURL("notes.html");
    window.open(url, "_blank");
  };

  const buttonStyle = {
    marginTop: "20px",
    padding: "10px 15px",
    fontSize: "16px",
    backgroundColor: theme === "dark" ? "#333" : "#fff",
    color: theme === "dark" ? "#fff" : "#000",
    border: "1px solid",
    borderColor: theme === "dark" ? "#555" : "#ccc",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  };

  return (
    <button onClick={openNotes} className="notes-btn" style={buttonStyle}>
      📝 Open Notes
    </button>
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
        <h2 style={{ margin: 0, marginRight: "10px" }}>Focus Flow Tracker</h2>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div className="content">
        <FocusTracker />
        <SiteBlocker />
        <TimeTracker />
        <NotesButton theme={theme} />
      </div>
    </div>
  );
}

// ---------------- Render ----------------
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<MainApp />);






