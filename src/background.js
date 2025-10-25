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
  
    // CLAUDE'S ADDITION - Start keep alive when tracking starts
    startKeepAlive();
    console.log('Tracking started at', new Date(sessionStart).toLocaleTimeString());
    sendResponse({success: true});
  }
  
  if (message.type === 'STOP_TRACKING') {
    isTracking = false;
    sessionStart = null;
    
    // CLAUDE'S ADDITION - Stop keep alive when tracking stops
    stopKeepAlive();
    console.log('Tracking stopped at', new Date().toLocaleTimeString());
    sendResponse({success: true});
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

  // Add this case inside your existing onMessage listener:
if (message.type === 'UPDATE_BLOCKING_RULES') {
  updateBlockingRules(message.sites);
  sendResponse({success: true});
}

});

// Siddh's CODE - Track tab switches (runs even when popup closed!)
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (isTracking) {
    tabSwitches++;
    currentTabId = activeInfo.tabId;
    console.log(`Tab switch detected! Total: ${tabSwitches}`);
    
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      if (tab.url) {
        checkDistraction(tab.url);
      }
    });
  }
});

// This function monitor when URL changes in current tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && isTracking) {
    console.log(`URL changed to: ${changeInfo.url}`);
    checkDistraction(changeInfo.url);
  }
});

// CLAUDE'S ADDITION - Handle service worker startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Background script started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');

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
    
    blockedSites.forEach((site, index) => {
      const ruleId = index + 1; // Start from 1
      newRules.push({
        id: ruleId,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: `*://*.${site.url}/*`,
          resourceTypes: ['main_frame']
        }
      });
    });

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



