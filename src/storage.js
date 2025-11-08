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

export function blocked_add(url, action = 'warn') {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ blockedSites: [] }, (data) => {
      const blockedSites = data.blockedSites;
      
      //This is to check if site already exists
      const existingIndex = blockedSites.findIndex(site => 
        typeof site === 'string' ? site === url : site.url === url
      );
      
      if (existingIndex === -1) {
        // Adding new sit with action
        blockedSites.push({ url, action });
        chrome.storage.sync.set({ blockedSites }, resolve);
      } else {
        resolve(); // Site already exists, do not replicate again
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
      const blockedSites = data.blockedSites.filter((site) => {
        //This portion is for handeling both old and new string format
        const siteUrl = typeof site === 'string' ? site : site.url;
        return siteUrl !== url;
      });
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
      // This portion convert old string format to new object format
      const normalizedSites = data.blockedSites.map(site => {
        if (typeof site === 'string') {
          return { url: site, action: 'warn' };
        }
        return site;
      });
      resolve(normalizedSites);
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

/*
export function time_get() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({TimeStart, TimeStop}, (res) => {
      resolve(res.TimeStop - res.TimeStart);
    });
  });
}*/

export function time_get() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["TimeStart", "TimeStop"], (res) => {
      if (res.TimeStart && res.TimeStop) {
        resolve(res.TimeStop - res.TimeStart);
      } else {
        resolve(0);
      }
    });
  });
}




/**
 * Gets the clean domain name from a URL for website time tracking
 * @param {string} url The URL to parse
 * @returns {string} The clean domain name or empty string if invalid
 */
function getWebsiteName(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, ''); // Remove www prefix
  } catch (e) {
    console.error("Invalid URL for website tracking:", url, e);
    return "";
  }
}

/**
 * Loads the persistent website time map from chrome storage
 * @returns {Promise<Map<string, number>>} A promise that resolves with the website time map
 */
export function websiteTimeMap_load() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ websiteTimeMap: {} }, (data) => {
      const map = new Map(Object.entries(data.websiteTimeMap));
      resolve(map);
    });
  });
}

/**
 * Saves the website time map to chrome storage
 * @param {Map<string, number>} timeMap The map to save (website -> seconds)
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
export function websiteTimeMap_save(timeMap) {
  return new Promise((resolve) => {
    const objectToSave = Object.fromEntries(timeMap);
    chrome.storage.local.set({ websiteTimeMap: objectToSave }, () => {
      console.log('Website time map saved:', objectToSave);
      resolve();
    });
  });
}

/**
 * Updates the time for a specific website in the persistent map
 * @param {string} url The website URL
 * @param {number} secondsToAdd Number of seconds to add to this website's total time
 * @returns {Promise<void>} A promise that resolves when the operation is complete
 */
export function websiteTimeMap_updateTime(url, secondsToAdd) {
  const websiteName = getWebsiteName(url);
  if (!websiteName || secondsToAdd <= 0) return Promise.resolve();

  return new Promise(async (resolve) => {
    const timeMap = await websiteTimeMap_load();
    const currentTime = timeMap.get(websiteName) || 0;
    timeMap.set(websiteName, currentTime + secondsToAdd);
    
    // Save immediately for critical updates, but the periodic save will handle most cases
    await websiteTimeMap_save(timeMap);
    resolve();
  });
}

/**
 * Gets the total time spent on a specific website
 * @param {string} url The website URL
 * @returns {Promise<number>} A promise that resolves with the total seconds spent on this website
 */
export function websiteTimeMap_getTime(url) {
  const websiteName = getWebsiteName(url);
  if (!websiteName) return Promise.resolve(0);

  return new Promise(async (resolve) => {
    const timeMap = await websiteTimeMap_load();
    resolve(timeMap.get(websiteName) || 0);
  });
}

/**
 * Gets the entire website time map as a plain object for easy display
 * @returns {Promise<Object>} A promise that resolves with {website: totalSeconds, ...}
 */
export function websiteTimeMap_getAll() {
  return new Promise(async (resolve) => {
    const timeMap = await websiteTimeMap_load();
    resolve(Object.fromEntries(timeMap));
  });
}
