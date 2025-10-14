import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { blocked_get, blocked_add, blocked_remove } from "./storage.js";
import "./blocker.css";

function SiteBlockerPage() {
  const [blockedSites, setBlockedSites] = useState([]);
  const [newSite, setNewSite] = useState("");
  const [theme, setTheme] = useState("light");

  // Load theme
  useEffect(() => {
    chrome.storage.local.get("theme", (result) => {
      setTheme(result.theme || "light");
    });
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    chrome.storage.local.set({ theme });
  }, [theme]);

  // Load blocked sites
  useEffect(() => {
    const fetchSites = async () => {
      const sites = await blocked_get();
      setBlockedSites(sites || []);
    };
    fetchSites();
  }, []);

  // Add site
  const addSite = async () => {
    const siteToAdd = newSite.trim().toLowerCase();
    
    // Validation
    if (!siteToAdd) {
      alert("Please enter a website!");
      return;
    }
    
    if (blockedSites.includes(siteToAdd)) {
      alert("This site is already blocked!");
      return;
    }

    await blocked_add(siteToAdd);
    setBlockedSites([...blockedSites, siteToAdd]);
    setNewSite("");
  };

  // Remove site
  const removeSite = async (siteToRemove) => {
    if (confirm(`Remove ${siteToRemove} from blocked list?`)) {
      await blocked_remove(siteToRemove);
      setBlockedSites(blockedSites.filter((s) => s !== siteToRemove));
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addSite();
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>
          Blocked Sites
        </h1>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title="Toggle theme"
        >
          {"☼"}
        </button>
      </div>

      {/* Main Card */}
      <div className="main-card">
        {blockedSites.length > 0 && (
          <div className="stats-section">
            <h2 className="section-title">Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{blockedSites.length}</div>
                <div className="stat-label">Total Blocked Sites</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">✓</div>
                <div className="stat-label">Warnings Active</div>
              </div>
            </div>
          </div>
        )}

        <h2 className="section-title">Add Blocked Website</h2>
        
        {/* Input Group */}
        <div className="input-group">
          <input
            type="text"
            className="site-input"
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., youtube.com, reddit.com, twitter.com"
          />
          <button className="add-btn" onClick={addSite}>
            Add
          </button>
        </div>


        {/* Sites List */}
        <h2 className="section-title">Blocked Sites ({blockedSites.length})</h2>
        
        {blockedSites.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No distraction sites yet</p>
            <p className="empty-subtext">
              Add websites that distract you from your goals
            </p>
          </div>
        ) : (
          <div className="sites-list">
            {blockedSites.map((site) => (
              <div key={site} className="site-item">
                <div className="site-info">
                  <span className="site-name">{site}</span>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeSite(site)}
                >
                  {"x"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Render
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<SiteBlockerPage />);
