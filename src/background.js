// Siddh's CODE - Background tracking that never stops
let isTracking = false;
let sessionStart = null;
let tabSwitches = 0;
let currentTabId = null;

let timerStart = null;
let timerStopped = null;
let elapsedTime = 0;

// CLAUDE'S ADDITION - Keep service worker alive
let keepAliveInterval;

const startKeepAlive = () => {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(() => {
    console.log('Keep alive ping');
  }, 20000); // Every 20 seconds
};

const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

let lastTimeWarned = {};     // Track cooldown per site
let distractionWarnings = 0; // Count total warnings


// CLAUDE'S ADDITION - Website time tracking variables
let currentWebsiteUrl = null;
let currentWebsiteStartTime = null;
let websiteTimeMap = new Map(); // website -> total seconds
let saveInterval; // For periodic saving every 5 minutes

//Modified here

// CLAUDE'S ADDITION - Website time tracking utility functions
function getWebsiteName(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, ''); // Remove www prefix
  } catch (e) {
    return null;
  }
}

async function loadWebsiteTimeMap() {
  try {
    const result = await chrome.storage.local.get({ websiteTimeMap: {} });
    websiteTimeMap = new Map(Object.entries(result.websiteTimeMap));
    console.log('Loaded website time map:', Object.fromEntries(websiteTimeMap));
  } catch (error) {
    console.error('Error loading website time map:', error);
    websiteTimeMap = new Map();
  }
}

async function saveWebsiteTimeMap() {
  try {
    const objectToSave = Object.fromEntries(websiteTimeMap);
    await chrome.storage.local.set({ websiteTimeMap: objectToSave });
    console.log('Saved website time map:', objectToSave);
  } catch (error) {
    console.error('Error saving website time map:', error);
  }
}

function startWebsiteTracking(url) {
  if (!url || !isTracking) return;

   if (url.startsWith('chrome-extension://') || 
      url.startsWith('chrome://') || 
      url.startsWith('edge://') || 
      url.includes('newtab')) {
    console.log(`Skipping tracking for: ${url}`);
    return;
  }
  
  const websiteName = getWebsiteName(url);
  if (!websiteName) return;
  
  // End tracking for previous website if any
  endCurrentWebsiteTracking();
  
  // Start tracking new website
  currentWebsiteUrl = url;
  currentWebsiteStartTime = Date.now();
  console.log(`Started tracking time for: ${websiteName}`);
}

function endCurrentWebsiteTracking() {
  if (!currentWebsiteUrl || !currentWebsiteStartTime) return;
  
  const websiteName = getWebsiteName(currentWebsiteUrl);
  if (!websiteName) return;
  
  const timeSpent = Math.floor((Date.now() - currentWebsiteStartTime) / 1000); // Convert to seconds
  if (timeSpent > 0) {
    const currentTotal = websiteTimeMap.get(websiteName) || 0;
    websiteTimeMap.set(websiteName, currentTotal + timeSpent);
    console.log(`Added ${timeSpent} seconds to ${websiteName}. Total: ${currentTotal + timeSpent} seconds`);
  }
  
  currentWebsiteUrl = null;
  currentWebsiteStartTime = null;
}

function startPeriodicSaving() {
  if (saveInterval) return; // Already started
  
  saveInterval = setInterval(async () => {
    if (isTracking) {
      // Update current website time before saving
      if (currentWebsiteUrl && currentWebsiteStartTime) {
        const websiteName = getWebsiteName(currentWebsiteUrl);
        if (websiteName) {
          const timeSpent = Math.floor((Date.now() - currentWebsiteStartTime) / 1000);
          const currentTotal = websiteTimeMap.get(websiteName) || 0;
          websiteTimeMap.set(websiteName, currentTotal + timeSpent);
          currentWebsiteStartTime = Date.now(); // Reset start time
        }
      }
      await saveWebsiteTimeMap();
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

function stopPeriodicSaving() {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
}

//modification end here

// FIX: Properly initialize on startup
(async () => {
  await loadWebsiteTimeMap();
  await restoreTrackingState();
})();

//This function extracts url name from the full url
function urlShortener(url) { 
  try {  
    return new URL(url).hostname.replace('www.', '');
  } catch(e) {  
    return null;
  }
}

// This function checks if a site should be warned about or blocked
function checkDistraction(url) {
  if (!isTracking) return; // Only check when tracking
  
  const domain = urlShortener(url);
  if (!domain) return; // Exit if invalid URL
  
  // Fetch the distraction list from storage
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    // Normalize sites to handle both old and new format
    const normalizedSites = data.blockedSites.map(site => {
      if (typeof site === 'string') {
        return { url: site, action: 'warn' };
      }
      return site;
    });
    
    const matchingSite = normalizedSites.find(site =>
      domain.includes(site.url) || site.url.includes(domain)
    );
    
    if (matchingSite && matchingSite.action === 'warn') {
      displayWarning(domain);
    }
  }); 
}

//Show warning if on a distraction site
function displayWarning(domain) {
  const now = Date.now();
  
  // Check cooldown: Has this site been warned about in the last minute?
  if (lastTimeWarned[domain] && (now - lastTimeWarned[domain] < 60000)) {
    console.log(`Cooldown active for ${domain}`);
    return;
  }

  // Show the warning notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: '⚠️ Distraction Alert!',
    message: `You're visiting ${domain}. Stay focused!`,
    priority: 2,
    requireInteraction: false
  });
  
  // Update tracking
  lastTimeWarned[domain] = now;
  distractionWarnings++;
  console.log(`Distraction warning #${distractionWarnings} for ${domain}`);
}

// Siddh's CODE - Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  console.log('Received message:', message);
  console.log('sender:', sender);
  if (message.type === 'START_TRACKING') {
    isTracking = true;
    sessionStart = Date.now();
    tabSwitches = 0;
    
    distractionWarnings = 0;      // Reset warning count
    lastTimeWarned = {};          // Clear cooldown timers
  
    //fix for tracker randomly stopping
    chrome.storage.session.set({
    isTracking: true,
    sessionStart: sessionStart,
    tabSwitches: 0,
    distractionWarnings: 0

    
  });

  // CLAUDE'S ADDITION - Start website time tracking
    startPeriodicSaving();
    // Get current tab and start tracking it
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        startWebsiteTracking(tabs[0].url);
      }
    });

    // CLAUDE'S ADDITION - Start keep alive when tracking starts
    startKeepAlive();
    console.log('Tracking started at', new Date(sessionStart).toLocaleTimeString());
    sendResponse({success: true});

    //enable ad blocking
    chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: ["adblocker"]
    });
  }
  
  if (message.type === 'STOP_TRACKING') {
    isTracking = false;
    sessionStart = null;
    
    chrome.storage.session.set({ isTracking: false }); //Fix for tracker randomly stopping

    // CLAUDE'S ADDITION - End website time tracking and save
    endCurrentWebsiteTracking();
    saveWebsiteTimeMap(); // Save immediately when stopping
    stopPeriodicSaving();

    // CLAUDE'S ADDITION - Stop keep alive when tracking stops
    stopKeepAlive();
    console.log('Tracking stopped at', new Date().toLocaleTimeString());
    sendResponse({success: true});

    //disable ad blocking
    chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ["adblocker"]
    });
  }
  
  if (message.type === 'GET_STATUS') {
    console.log('GET_STATUS requested. Tracking:', isTracking, 'Tab switches:', tabSwitches);
    sendResponse({
      isTracking,
      tabSwitches,
      distractionWarnings,
      timeElapsed: sessionStart ? Date.now() - sessionStart : 0
    });
  }

/*
  // CLAUDE'S ADDITION - Get website time statistics
  if (message.type === 'GET_WEBSITE_STATS') {
    // Update current website time before sending stats
    if (currentWebsiteUrl && currentWebsiteStartTime && isTracking) {
      const websiteName = getWebsiteName(currentWebsiteUrl);
      if (websiteName) {
        const timeSpent = Math.floor((Date.now() - currentWebsiteStartTime) / 1000);
        const currentTotal = websiteTimeMap.get(websiteName) || 0;
        websiteTimeMap.set(websiteName, currentTotal + timeSpent);
        currentWebsiteStartTime = Date.now(); // Reset start time
      }
    }
    
    const stats = Object.fromEntries(websiteTimeMap);
    sendResponse({ websiteStats: stats });
  }*/
  // CLAUDE'S ADDITION - Get website time statistics
if (message.type === 'GET_WEBSITE_STATS') {
  // Update current website time before sending stats
  if (currentWebsiteUrl && currentWebsiteStartTime && isTracking) {
    const websiteName = getWebsiteName(currentWebsiteUrl);
    if (websiteName) {
      const timeSpent = Math.floor((Date.now() - currentWebsiteStartTime) / 1000);
      const currentTotal = websiteTimeMap.get(websiteName) || 0;
      websiteTimeMap.set(websiteName, currentTotal + timeSpent);
      currentWebsiteStartTime = Date.now(); // Reset start time
    }
  }
  
  // FIX: Return the in-memory map (fresh data) instead of reading from storage
  const stats = Object.fromEntries(websiteTimeMap);
  console.log('📊 Sending website stats:', stats);
  sendResponse({ websiteStats: stats });
  return true; // Keep message channel open for async response
}



  // Add this case inside your existing onMessage listener:
if (message.type === 'UPDATE_BLOCKING_RULES') {
  updateBlockingRules(message.sites);
  sendResponse({success: true});
}

});

/*
// Siddh's CODE - Track tab switches (runs even when popup closed!)
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isTracking) {
    tabSwitches++;
    currentTabId = activeInfo.tabId;

    chrome.storage.session.set({ tabSwitches });

    console.log(`Tab switch detected! Total: ${tabSwitches}`);
    
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url) {
        checkDistraction(tab.url);
        // CLAUDE'S ADDITION - Start tracking time for new tab
        startWebsiteTracking(tab.url);
      }
    });
  }
});*/

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isTracking) {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url) {
        currentTabId = activeInfo.tabId;
        
        // NEW: Only count switches to real websites
        if (!tab.url.startsWith('chrome-extension://') && 
            !tab.url.startsWith('chrome://') && 
            !tab.url.startsWith('edge://') && 
            !tab.url.includes('newtab')) {
          
          tabSwitches++;
          chrome.storage.session.set({ tabSwitches });
          console.log(`Real tab switch detected! Total: ${tabSwitches}`);
        } else {
          console.log(`Skipped counting switch to: ${tab.url}`);
        }
        
        checkDistraction(tab.url);
        startWebsiteTracking(tab.url);
      }
    });
  }
});




// This function monitor when URL changes in current tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && isTracking) {
    console.log(`URL changed to: ${changeInfo.url}`);
    checkDistraction(changeInfo.url);

    // CLAUDE'S ADDITION - Handle URL change (switch website tracking)
    if (tabId === currentTabId) {
      startWebsiteTracking(changeInfo.url);
    }
  }
});

// CLAUDE'S ADDITION - Handle service worker startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Background script started');
  await loadWebsiteTimeMap(); // FIX: await the load
  await restoreTrackingState();
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed/updated');
  await loadWebsiteTimeMap(); // FIX: await the load
  await restoreTrackingState();
 
  // CLEAR OLD BLOCKING RULES (from previous version that used declarativeNetRequest)
  if (chrome.declarativeNetRequest) {
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      const ruleIds = rules.map(rule => rule.id);
      if (ruleIds.length > 0) {
        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds
        }, () => {
          console.log('Cleared', ruleIds.length, 'old blocking rules');
          initializeBlockingRules();
        });
      } else {
        console.log('No old blocking rules to clear');
        initializeBlockingRules();
      }
    });
  }

});

// Update blocking rules when sites list changes
function updateBlockingRules(sites) {
  if (!chrome.declarativeNetRequest) {
    console.log('declarativeNetRequest not available');
    return;
  }

  // Get current dynamic rules
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingRuleIds = existingRules.map(rule => rule.id);
    
    // Create new rules for sites with 'block' action
    const newRules = [];
    const blockedSites = sites.filter(site => site.action === 'block');
     console.log('Sites to block:', blockedSites); //temp
    
    blockedSites.forEach((site, index) => {
      const ruleId = index + 1; // Start from 1

      /*
      newRules.push({
        id: ruleId,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: `*://*.${site.url}/*`,
          resourceTypes: ['main_frame']
        }
      });
      */

      // Rule for bare domain (x.com)
      //For some reason youtube.com is still not fixed. Maybe the issue is with url pattern matching only subdomains?
  newRules.push({
  id: ruleId * 2 - 1,
  priority: 1,
  action: { type: 'block' },
  condition: {
    urlFilter: `*://${site.url}/*`,
    resourceTypes: ['main_frame']
  }
});

  // Rule for subdomains (www.youtube.com, m.youtube.com, etc)
  newRules.push({
  id: ruleId * 2,
  priority: 1,
  action: { type: 'block' },
  condition: {
    urlFilter: `*://*.${site.url}/*`,
    resourceTypes: ['main_frame']
  }
});
});

 console.log('New rules to add:', newRules); //temp
    // Update rules: remove all existing, add new ones
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating blocking rules:', chrome.runtime.lastError);
      } else {
        console.log(`Updated blocking rules: ${newRules.length} sites blocked`);
      }
    });
  });
}

// Initialize blocking rules from stored sites
function initializeBlockingRules() {
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    const normalizedSites = data.blockedSites.map(site => {
      if (typeof site === 'string') {
        return { url: site, action: 'warn' };
      }
      return site;
    });
    
    updateBlockingRules(normalizedSites);
    console.log('Initialized blocking rules for', normalizedSites.length, 'sites');
  });
}

async function restoreTrackingState() {
  chrome.storage.session.get(['isTracking', 'sessionStart', 'tabSwitches', 'distractionWarnings'], (data) => {
    if (data.isTracking) {
      isTracking = true;
      sessionStart = data.sessionStart || Date.now();
      tabSwitches = data.tabSwitches || 0;
      distractionWarnings = data.distractionWarnings || 0;
      startKeepAlive();

      // CLAUDE'S ADDITION - Restore website tracking if needed
      startPeriodicSaving();
      // Get current active tab to start tracking
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          currentTabId = tabs[0].id;
          startWebsiteTracking(tabs[0].url);
        }
      });

      console.log('Restored tracking state active');
    }
  });
}


