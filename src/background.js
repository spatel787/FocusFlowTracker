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

// This function checks if a site is a distraction
function checkDistraction(url) {
  if (!isTracking) return; // Only check when tracking
  
  const domain = urlShortener(url);
  if (!domain) return; // Exit if invalid URL
  
  // Fetch the distraction list from storage
  chrome.storage.sync.get({ blockedSites: [] }, (data) => {
    const isDistraction = data.blockedSites.some(site =>
      domain.includes(site) || site.includes(domain)
    );
    
    if (isDistraction) {
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
});

