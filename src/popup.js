import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import "storage.js";

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
        <div style={{background: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '20px'}}>
            <h2>Focus Flow Tracker</h2>
            <div style={{background: isExtensionActive ? '#e8f5e8' : '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '10px'}}>
                <p>Status: {isExtensionActive ? '🟢 TRACKING' : '🔴 INACTIVE'}</p>
                {isExtensionActive && <p>Tab Switches: {tabSwitches}</p>}
                <p><strong>Current Site:</strong> {getDomain(currentTab)}</p>
                <button 
                    onClick={toggleTracking}
                    style={{
                        padding: '8px 15px', 
                        background: isExtensionActive ? '#f44336' : '#4CAF50', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '3px'
                    }}
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
        <div style={{ marginTop: '20px' }}>
            <h2>Site Blocker</h2>
            <input
                type="text"
                value={newSite}
                placeholder="example.com"
                onChange={(e) => setNewSite(e.target.value)}
            />
            <button onClick={addSite}>Block</button>
            <ul>
                {blockedSites.map(site => (
                    <li key={site}>
                        {site} <button onClick={() => removeSite(site)}>Remove</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Main_App() {
    const [notes, setNotes] = useState(['Buy groceries', 'Finish homework']);
    const [newNote, setNewNote] = useState('');

    const add_Note = () => {
        if (!newNote.trim()) return;
        setNotes([...notes, newNote.trim()]);
        setNewNote('');
    };

    return (
        <div style={{padding: '20px'}}>
            <FocusTracker />
            
            <h1>Take a Quick Note</h1>
            <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
            />
            <button onClick={add_Note}>Add</button>
            <p>{notes.join(', ')}</p>

            <hr />

            <SiteBlocker />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Main_App />);


