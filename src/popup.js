import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// ---------------- Site Blocker feature (new) ----------------
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
    let idCounter = 1;
    sites.forEach(site => {
        rules.push({
        id: idCounter++,
        priority: 1,
        action: { type: "block" },
        condition: {
            urlFilter: site,  // <-- no "*://", just domain pattern
            resourceTypes: ["main_frame"]
        }
        });
    });
    return rules;
    };

    const updateRules = (sites) => {
        if (typeof chrome !== 'undefined' && chrome.declarativeNetRequest) {
            // Remove all existing dynamic rules
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
    // ---------------- Notes feature (existing) ----------------
    const [notes, setNotes] = useState(['Buy groceries', 'Finish homework']);
    const [newNote, setNewNote] = useState('');

    const add_Note = () => {
        if (!newNote.trim()) return;
        setNotes([...notes, newNote.trim()]);
        setNewNote('');
    };

    return (
        <div>
            <h1>Take a Quick Note</h1>
            <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
            />
            <button onClick={add_Note}>Add</button>
            <p>{notes.join(', ')}</p>

            <hr />

            {/* Site Blocker Section */}
            <SiteBlocker />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Main_App />);


