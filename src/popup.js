import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import "./storage.js";
import "./popup.css";

// Focus Flow Tracker component
function FocusTracker() {
    const [isExtensionActive, setIsExtensionActive] = useState(false);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [currentTab, setCurrentTab] = useState('Loading...');

    useEffect(() => {
        // Get current tab
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    setCurrentTab(tabs[0].url);
                }
            });
        }

        // Get status from background script
        chrome.runtime.sendMessage({type: 'GET_STATUS'}, (response) => {
            if (response) {
                setIsExtensionActive(response.isTracking || false);
                setTabSwitches(response.tabSwitches || 0);
            }
        });
    }, []);

    const toggleTracking = () => {
        if (!isExtensionActive) {
            chrome.runtime.sendMessage({type: 'START_TRACKING'}, (response) => {
                if (response && response.success) {
                    setIsExtensionActive(true);
                    setTabSwitches(0);
                }
            });
        } else {
            chrome.runtime.sendMessage({type: 'STOP_TRACKING'}, (response) => {
                if (response && response.success) {
                    setIsExtensionActive(false);
                }
            });
        }
    };

    const getDomain = (url) => {
        try {
            return new URL(url).hostname;
        } catch {
            return 'Loading...';
        }
    };

    return (
        <div className="card">
            <h2>Focus Flow Tracker</h2>
            <div className={`status ${isExtensionActive ? 'active' : 'inactive'}`}>
                <p>Status: {isExtensionActive ? '🟢 TRACKING' : '🔴 INACTIVE'}</p>
                {isExtensionActive && <p>Tab Switches: {tabSwitches}</p>}
                <p><strong>Current Site:</strong> {getDomain(currentTab)}</p>
                <button 
                    onClick={toggleTracking}
                    className={isExtensionActive ? 'red' : 'green'}
                >
                    {isExtensionActive ? 'Stop' : 'Start'} Tracking
                </button>
            </div>
        </div>
    );
}

// Site Blocker component
function SiteBlocker() {
    const [blockedSites, setBlockedSites] = useState([]);
    const [newSite, setNewSite] = useState('');

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(['blockedSites'], (result) => {
                if (result.blockedSites) {
                    setBlockedSites(result.blockedSites);
                    updateRules(result.blockedSites);
                } else {
                    const defaults = ['youtube.com', 'tiktok.com', 'reddit.com'];
                    setBlockedSites(defaults);
                    chrome.storage.sync.set({ blockedSites: defaults });
                    updateRules(defaults);
                }
            });
        }
    }, []);

    const generateRules = (sites) => {
        let rules = [];
        let idCounter = 10000;
        sites.forEach(site => {
            rules.push({
                id: idCounter++,
                priority: 1,
                action: { type: "block" },
                condition: {
                    urlFilter: site,
                    resourceTypes: ["main_frame"]
                }
            });
        });
        return rules;
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

    const addSite = () => {
        if (!newSite.trim()) return;
        const updated = [...blockedSites, newSite.trim()];
        setBlockedSites(updated);
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ blockedSites: updated });
        }
        updateRules(updated);
        setNewSite('');
    };

    const removeSite = (site) => {
        const updated = blockedSites.filter(s => s !== site);
        setBlockedSites(updated);
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({ blockedSites: updated });
        }
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
                    <li key={site} style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '5px 0',
                        borderBottom: '1px solid #eee'
                    }}>
                        <span>{site}</span>
                        <button onClick={() => removeSite(site)} className="gray">Remove</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function NotesSection() {
    const [notes, setNotes] = useState(['Buy groceries', 'Finish homework']);
    const [newNote, setNewNote] = useState('');
    const [completedNotes, setCompletedNotes] = useState([]);

    // Load notes from storage on component mount
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['activeNotes', 'completedNotes'], (result) => {
                if (result.activeNotes) setNotes(result.activeNotes);
                if (result.completedNotes) setCompletedNotes(result.completedNotes);
            });
        }
    }, []);

    // Save notes to storage whenever they change
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({
                activeNotes: notes,
                completedNotes: completedNotes
            });
        }
    }, [notes, completedNotes]);

    const addNote = () => {
        if (!newNote.trim()) return;
        setNotes([...notes, newNote.trim()]);
        setNewNote('');
    };

    const completeNote = (index) => {
        const noteToComplete = notes[index];
        const newNotes = notes.filter((_, i) => i !== index);
        setNotes(newNotes);
        setCompletedNotes([...completedNotes, {
            text: noteToComplete,
            completedAt: new Date().toLocaleString()
        }]);
    };

    const uncompleteNote = (index) => {
        const noteToUncomplete = completedNotes[index];
        setCompletedNotes(completedNotes.filter((_, i) => i !== index));
        setNotes([...notes, noteToUncomplete.text]);
    };

    const deleteNote = (index) => {
        setNotes(notes.filter((_, i) => i !== index));
    };

    const deleteCompletedNote = (index) => {
        setCompletedNotes(completedNotes.filter((_, i) => i !== index));
    };

    const clearAllCompleted = () => {
        setCompletedNotes([]);
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
            
            {/* Active Notes */}
            {notes.length > 0 && (
                <div className="notes-section">
                    <h3 style={{margin: '15px 0 10px 0', fontSize: '0.95rem', color: 'var(--text-color)'}}>
                        📝 Active Notes ({notes.length})
                    </h3>
                    <ul className="notes-list">
                        {notes.map((note, index) => (
                            <li key={index} className="note-item">
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                    <input
                                        type="checkbox"
                                        onChange={() => completeNote(index)}
                                        className="note-checkbox"
                                    />
                                    <span className="note-text">{note}</span>
                                </div>
                                <button 
                                    onClick={() => deleteNote(index)} 
                                    className="delete-btn"
                                    title="Delete note"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Completed Notes */}
            {completedNotes.length > 0 && (
                <div className="notes-section completed-notes">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0 10px 0'}}>
                        <h3 style={{fontSize: '0.95rem', color: 'var(--text-color)'}}>
                            ✅ Completed ({completedNotes.length})
                        </h3>
                        <button 
                            onClick={clearAllCompleted} 
                            className="gray"
                            style={{fontSize: '0.8rem', padding: '3px 8px'}}
                        >
                            Clear All
                        </button>
                    </div>
                    <ul className="notes-list">
                        {completedNotes.map((note, index) => (
                            <li key={index} className="note-item completed">
                                <div style={{display: 'flex', alignItems: 'center', gap: '10px', flex: 1}}>
                                    <input
                                        type="checkbox"
                                        checked
                                        onChange={() => uncompleteNote(index)}
                                        className="note-checkbox"
                                    />
                                    <span className="note-text completed">{note.text}</span>
                                </div>
                                <button 
                                    onClick={() => deleteCompletedNote(index)} 
                                    className="delete-btn"
                                    title="Delete note"
                                >
                                    ×
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {notes.length === 0 && completedNotes.length === 0 && (
                <div className="empty-state">
                    <p style={{textAlign: 'center', color: '#666', fontStyle: 'italic', margin: '20px 0'}}>
                        No notes yet. Add a note to get started!
                    </p>
                </div>
            )}
        </div>
    );
}

function TimeTracker() {
// Credit to https://medium.com/how-to-react/simple-way-to-create-a-stopwatch-in-react-js-bcc0e08e041e
    // state to store time
    const [time, setTime] = useState(0);
    
    // state to check stopwatch running or not
    const [isRunning, setIsRunning] = useState(false);
    

    useEffect(() => {//Get saved state from storage
        chrome.storage.session.get(['isRunning'], (result) => {
            if (result.isRunning !== undefined) {
                setIsRunning(result.isRunning);
            }
            else {
                setIsRunning(false);
            }
        });
        chrome.storage.session.get(['StartTime', 'StopTime'], (result) => {
            if (result.StartTime && !result.StopTime) {
                const startTime = result.StartTime;
                const elapsed = Date.now() - startTime;
                setTime(elapsed);
            }
            else if (result.StartTime && result.StopTime) {
                const elapsed = result.StopTime - result.StartTime;
                setTime(elapsed);
            }
        });
    }, []);


    
    useEffect(() => {// update time every 10 milliseconds if running
        let intervalId;
        if (isRunning) {
            // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
            intervalId = setInterval(() => setTime(time + 1), 10);
        }
        return () => clearInterval(intervalId);
    }, [isRunning, time]);

    // Hours calculation
    const hours = Math.floor(time / 360000);

    // Minutes calculation
    const minutes = Math.floor((time % 360000) / 6000);

    // Seconds calculation
    const seconds = Math.floor((time % 6000) / 100);

    // Method to start and stop timer
    const startAndStop = () => {
        if (!isRunning) {
            chrome.storage.session.set({StartTime: Date.now() });
            chrome.storage.session.set({isRunning: true });
            setIsRunning(true);
        }
        else {
            chrome.storage.session.set({StopTime: Date.now() });
            chrome.storage.session.set({isRunning: false });
            setIsRunning(false);
        }
    };

    // Method to reset timer back to 0
    const reset = () => {
        if (isRunning) {
            chrome.storage.session.set({StartTime: Date.now()});
        }
        else {
            chrome.storage.session.set({StartTime: null});
        }
        chrome.storage.session.set({StopTime: null});
        setTime(0);
    };
    return (
        <div className="stopwatch-container">
            <p className="stopwatch-time">
                {hours}:{minutes.toString().padStart(2, "0")}:
                {seconds.toString().padStart(2, "0")}
            </p>
            <div className="stopwatch-buttons">
                <button className="stopwatch-button" onClick={startAndStop}>
                    {isRunning ? "Stop" : "Start"}
                </button>
                <button className="stopwatch-button" onClick={reset}>
                    Reset
                </button>
            </div>
        </div>
    );
}


function MainApp() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        chrome.storage.local.set({ theme });
    }, [theme]);

    useEffect(() => {
        // load saved preference
        chrome.storage.local.get('theme', (result) => {
            if (result.theme) {
                setTheme(result.theme);
            }
        });
    }, []);

    return (
        <div style={{padding: '15px', width: '320px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h1>FocusFlow Tracker</h1>
                <button
                    className="toggle-btn"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                    {theme === 'light' ? '🌙' : '☀️'}
                </button>
            </div>
            
            <FocusTracker />
            <NotesSection />
            <SiteBlocker />
            <TimeTracker />
        </div>
    );
}

// Only render once!
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MainApp />);

