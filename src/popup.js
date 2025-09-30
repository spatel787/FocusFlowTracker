//Debugged and reviewed with the assistance of Claude.

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
// Import the functions from storage.js file
import { 
    blocked_get, 
    blocked_add, 
    blocked_remove,
    notes_get,
    notes_add,
    notes_remove
} from "./storage.js";
import "./popup.css";

// Focus Flow Tracker component
function FocusTracker() {
    const [isExtensionActive, setIsExtensionActive] = useState(false);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [currentTab, setCurrentTab] = useState('Loading...');

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    setCurrentTab(tabs[0].url);
                }
            });
        }
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({type: 'GET_STATUS'}, (response) => {
                if (response) {
                    setIsExtensionActive(response.isTracking || false);
                    setTabSwitches(response.tabSwitches || 0);
                }
            });
        }
    }, []);

    const toggleTracking = () => {
        const messageType = isExtensionActive ? 'STOP_TRACKING' : 'START_TRACKING';
        chrome.runtime.sendMessage({type: messageType}, (response) => {
            if (response && response.success) {
                setIsExtensionActive(!isExtensionActive);
                if (!isExtensionActive) setTabSwitches(0);
            }
        });
    };

    const getDomain = (url) => {
        try { return new URL(url).hostname; } catch { return 'Loading...'; }
    };

    return (
        <div className="card">
            <h2>Focus Flow Tracker</h2>
            <div className={`status ${isExtensionActive ? 'active' : 'inactive'}`}>
                <p>Status: {isExtensionActive ? 'TRACKING' : 'INACTIVE'}</p>
                <p>Tab Switches: {tabSwitches}</p>
                <p><strong>Current Site:</strong> {getDomain(currentTab)}</p>
                <button onClick={toggleTracking} className={isExtensionActive ? 'red' : 'green'}>
                    {isExtensionActive ? 'Stop' : 'Start'} Tracking
                </button>
            </div>
        </div>
    );
}

// Site Blocker component - INTEGRATED WITH STORAGE.JS
function SiteBlocker() {
    const [blockedSites, setBlockedSites] = useState([]);
    const [newSite, setNewSite] = useState('');

    useEffect(() => {
        const fetchSites = async () => {
            const sites = await blocked_get();
            if (sites && sites.length > 0) {
                setBlockedSites(sites);
                updateRules(sites);
            } /*else {
                const defaults = ['youtube.com', 'tiktok.com', 'reddit.com'];
                setBlockedSites(defaults);
                // Use raw set for initial default population, since storage.js doesn't have a "set all"
                chrome.storage.sync.set({ blockedSites: defaults });
                updateRules(defaults);
            }*/
        };
        if (typeof chrome !== 'undefined' && chrome.storage) {
            fetchSites();
        }
    }, []);

    const generateRules = (sites) => {
        return sites.map((site, index) => ({
            id: 10000 + index,
            priority: 1,
            action: { type: "block" },
            condition: { urlFilter: site, resourceTypes: ["main_frame"] }
        }));
    };

    const updateRules = (sites) => {
        if (typeof chrome !== 'undefined' && chrome.declarativeNetRequest) {
            chrome.declarativeNetRequest.getDynamicRules(rules => {
                const removeIds = rules.map(r => r.id);
                const addRules = generateRules(sites);
                chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: removeIds,
                    addRules: addRules
                });
            });
        }
    };

    const addSite = async () => {
        const siteToAdd = newSite.trim();
        if (!siteToAdd || blockedSites.includes(siteToAdd)) return;
        
        await blocked_add(siteToAdd); // Use storage function
        const updated = [...blockedSites, siteToAdd];
        setBlockedSites(updated);
        updateRules(updated);
        setNewSite('');
    };

    const removeSite = async (siteToRemove) => {
        await blocked_remove(siteToRemove); // Use storage function
        const updated = blockedSites.filter(s => s !== siteToRemove);
        setBlockedSites(updated);
        updateRules(updated);
    };

    return (
        <div className="card">
            <h2>Site Blocker</h2>
            <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <input
                    type="text"
                    value={newSite}
                    placeholder="example.com"
                    onChange={(e) => setNewSite(e.target.value)}
                    style={{flex: 1, padding: '5px'}}
                />
                <button onClick={addSite} className="green">Block</button>
            </div>
            <ul style={{listStyle: 'none', padding: 0}}>
                {blockedSites.map(site => (
                    <li key={site} className="list-item">
                        <button onClick={() => removeSite(site)} className="gray">Remove</button>
                        <span>    {site}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// NotesSection component - INTEGRATED WITH STORAGE.JS
function NotesSection() {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            const storedNotes = await notes_get();
            setNotes(storedNotes || []);
        };
        fetchNotes();
    }, []);

    const addNote = async () => {
        const noteToAdd = newNote.trim();
        if (!noteToAdd || notes.includes(noteToAdd)) return;
        
        await notes_add(noteToAdd); // Use storage function
        setNotes([...notes, noteToAdd]);
        setNewNote('');
    };

    const deleteNote = async (noteToDelete) => {
        await notes_remove(noteToDelete); // Use storage function
        setNotes(notes.filter(note => note !== noteToDelete));
    };

    return (
        <div className="card">
            <h2>Quick Notes</h2>
            <div className="input-group">
                <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note..."
                    onKeyPress={(e) => e.key === 'Enter' && addNote()}
                />
                <button onClick={addNote} className="green">Add</button>
            </div>
            
            <ul className="notes-list">
                {notes.map((note, index) => (
                    <li key={index} className="note-item">
                        <span className="note-text">{note}</span>
                        <button onClick={() => deleteNote(note)} className="delete-btn" title="Delete note">
                            ×
                        </button>
                    </li>
                ))}
            </ul>

            {notes.length === 0 && (
                <div className="empty-state">
                    <p style={{textAlign: 'center', color: '#666', fontStyle: 'italic', margin: '20px 0'}}>
                        No notes yet. Add one to get started!
                    </p>
                </div>
            )}
        </div>
    );
}


// TimeTracker component
function TimeTracker() {
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.session.get(['isRunning', 'StartTime', 'StopTime'], (result) => {
                setIsRunning(result.isRunning || false);
                if (result.StartTime && !result.StopTime) {
                    setTime(Date.now() - result.StartTime);
                } else if (result.StartTime && result.StopTime) {
                    setTime(result.StopTime - result.StartTime);
                }
            });
        }
    }, []);

    useEffect(() => {
        let intervalId;
        if (isRunning) {
            intervalId = setInterval(() => setTime(prevTime => prevTime + 10), 10);
        }
        return () => clearInterval(intervalId);
    }, [isRunning]);

    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);

    const startAndStop = () => {
        const newIsRunning = !isRunning;
        setIsRunning(newIsRunning);
        chrome.storage.session.set({ isRunning: newIsRunning });
        if (newIsRunning) {
            chrome.storage.session.set({ StartTime: Date.now() - time, StopTime: null });
        } else {
            chrome.storage.session.get(['StartTime'], (result) => {
                chrome.storage.session.set({ StopTime: result.StartTime + time });
            });
        }
    };

    const reset = () => {
        setTime(0);
        chrome.storage.session.set({ StartTime: isRunning ? Date.now() : null, StopTime: null });
    };
    return (
        <div className="card stopwatch-container">
             <h2>Session Timer</h2>
            <p className="stopwatch-time">
                {hours.toString().padStart(2, "0")}:
                {minutes.toString().padStart(2, "0")}:
                {seconds.toString().padStart(2, "0")}
            </p>
            <div className="stopwatch-buttons">
                <button onClick={startAndStop} className={`stopwatch-button ${isRunning ? 'red' : 'green'}`}>
                    {isRunning ? "Stop" : "Start"}
                </button>
                <button onClick={reset} className="stopwatch-button gray">
                    Reset
                </button>
            </div>
        </div>
    );
}

// MainApp component
function MainApp() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get('theme', (result) => {
                if (result.theme) setTheme(result.theme);
            });
        }
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ theme });
        }
    }, [theme]);

    return (
        <div className="app-container">
            <div className="header">
                <button
                    className="toggle-btn"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                    {theme === 'light' ? '☼' : '☼'}
                </button>
            </div>
            
            <FocusTracker />
            <NotesSection />
            <SiteBlocker />
            <TimeTracker />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MainApp />);
