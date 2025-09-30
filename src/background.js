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

// Siddh's CODE - Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  console.log('Received message:', message);
  console.log('sender:', sender);
  if (message.type === 'START_TRACKING') {
    isTracking = true;
    sessionStart = Date.now();
    tabSwitches = 0;
    
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
  }
});

// CLAUDE'S ADDITION - Handle service worker startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Background script started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
});
