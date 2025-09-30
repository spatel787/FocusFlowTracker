// Wrapper functions for chrome.storage.sync to make API calls easier and more centralized.
// Written and commented with assistance from GPT model Gemini 2.5 Pro 

/**
 * Extracts the root domain from a given URL.
 * @param {string} url The URL to parse.
 * @returns {string} The root domain, or an empty string if invalid.
 */
function root_domain_get(url) {
  try {
    // A new URL object will throw an error if the URL is invalid.
    return new URL(url).hostname;
  } catch (e) {
    console.error("Invalid URL:", url, e);
    return "";
  }
}

/**
 * Adds a URL to the list of blocked sites in chrome.storage.sync.
 * @param {string} url The URL to block.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export function blocked_add(url) {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      const blockedSites = data.blockedSites;
      if (!blockedSites.includes(url)) {
        blockedSites.push(url);
        chrome.storage.sync.set({ blockedSites }, resolve);
      } else {
        resolve(); // Resolve even if the URL is already there
      }
    });
  });
}

/**
 * Removes a URL from the list of blocked sites in chrome.storage.sync.
 * @param {string} url The URL to unblock.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export function blocked_remove(url) {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      const blockedSites = data.blockedSites.filter((site) => site !== url);
      chrome.storage.sync.set({ blockedSites }, resolve);
    });
  });
}

/**
 * Retrieves the list of all blocked sites from chrome.storage.sync.
 * @returns {Promise<string[]>} A promise that resolves with an array of blocked site URLs.
 */
export function blocked_get() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      resolve(data.blockedSites);
    });
  });
}

/*
  Schema for a history item:
  const exampleHistoryItem = {
    "tab-id": 1471247,         // unique id from chrome.tabs API
    "root-domain": "google.com", // root domain of the URL
    "time-start": 1672531200, // Unix timestamp (seconds)
    "time-end": 1672531260,   // Unix timestamp (seconds), null if still active
  };
*/

/**
 * Adds a new website visit record to the history.
 * @param {number} tabId The ID of the tab where the visit occurred.
 * @param {string} url The URL of the website being visited.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export function history_add(tabId, url) {
  return new Promise((resolve) => {
    const rootDomain = root_domain_get(url);
    if (!rootDomain) {
      resolve(); // Don't track invalid URLs
      return;
    }

    const newHistoryItem = {
      "tab-id": tabId,
      "root-domain": rootDomain,
      "time-start": Math.floor(Date.now() / 1000),
      "time-end": null, // Initially null, set when tab is closed or URL changes
    };

    chrome.storage.sync.get({ siteHistory: [] }, (data) => {
      const siteHistory = data.siteHistory;
      siteHistory.push(newHistoryItem);
      chrome.storage.sync.set({ siteHistory }, resolve);
    });
  });
}

/**
 * Sets the end time for the latest history entry of a specific tab.
 * This marks the end of a visit.
 * @param {number} tabId The ID of the tab to update.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export function history_set_endtime(tabId) {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ siteHistory: [] }, (data) => {
      const siteHistory = data.siteHistory;
      // Find the last active entry for this tabId
      const index = siteHistory.findLastIndex(
        (item) => item["tab-id"] === tabId && item["time-end"] === null
      );

      if (index !== -1) {
        siteHistory[index]["time-end"] = Math.floor(Date.now() / 1000);
        chrome.storage.sync.set({ siteHistory }, resolve);
      } else {
        resolve(); // No active session found for this tab
      }
    });
  });
}

/**
 * Retrieves the entire website visit history from chrome.storage.sync.
 * @returns {Promise<object[]>} A promise that resolves with the site history array.
 */
export function history_get() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ siteHistory: [] }, (data) => {
      resolve(data.siteHistory);
    });
  });
}

/**
 * Adds a new note to the list in chrome.storage.sync.
 * @param {string} note The text content of the note to add.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export function notes_add(note) {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ notes: [] }, (data) => {
      const notes = data.notes;
      notes.push(note);
      chrome.storage.sync.set({ notes }, resolve);
    });
  });
}

/**
 * Removes a specific note from the list in chrome.storage.sync.
 * @param {string} note The text content of the note to remove.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export function notes_remove(note) {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ notes: [] }, (data) => {
      const notes = data.notes.filter((n) => n !== note);
      chrome.storage.sync.set({ notes }, resolve);
    });
  });
}

/**
 * Retrieves all stored notes from chrome.storage.sync.
 * @returns {Promise<string[]>} A promise that resolves with an array of notes.
 */
export function notes_get() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ notes: [] }, (data) => {
      resolve(data.notes);
    });
  });
}
