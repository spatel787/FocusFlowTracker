# Sprint 1 Reflection

**Name:** Siddh Patel
**GitHub ID:** spate198
**Group:** FocusFlowTracker

---

## What you planned to do
* Began by setting up React integration with Chrome extension architecture
* Implement tab switching feature
* Create background service worker for tracking
* Build popup interface with tracking controls
* Build and Integrate my working environment and my work so my teammates' can work on it

---

## What you did not do
* I apologize we did not know about Github issue creation on github before, so we started and commited our work. And then I had to manually create 3 issues and link my commits to it upon writing this.
* Time, Distractive Sites blocker, better UI, Storage, these are all the features my teammates worked on

---

## What problems you encountered
* **Learning curve**: New to JavaScript and React environment. I had to spent hours required learning and AI assistance to understand concepts
* **Service worker lifecycle**: Background script was terminating upon closing the extension, had to implement keep-alive mechanism with Claude's help
* **Merge conflicts**: Integrating my Focus Tracker with teammate's Site blocker broke few things and I had to fix my part
* **Chrome API complexity**: Understanding message passing between popup and background script took me a lot of time to understand

---

## Issues you worked on
* #9 - HTML for Chrome extension setup: React Environment (src/popup.html)
* #8 - Background service worker implementation: Update background.js
* #10 - Tab switching detection feature in popup.js: Update popup.js

---

## Files you worked on
* `src/popup.html` - This is HTML template for extension popup
* `src/popup.js` - React components for Focus Flow Tracker interface
* `src/background.js` - Background service worker for tracking
* `manifest.json` - Chrome extension configuration with permissions
* `webpack.config.js` - This was provided to me by Claude. Build configuration for multiple entry points
* `package.json` - This was provided to me by claude. Dependencies for React and build tools

---

## Use of AI and/or 3rd party software

**AI Usage (Claude/Anthropic):**
* Used Claude extensively to learn JavaScript and React concepts
* Got assistance with Chrome extension architecture and API usage
* Received help debugging service worker issue in background.js
* Helped me write background.js and popup.js (tab switching feature) and fix my errors

**3rd Party Software:**
* React 18.2.0 - UI framework
* Webpack 5 - Build tooling
* Chrome Extension APIs - Built-in browser APIs

---

## What you accomplished

**Core Architecture:** I established the React + Chrome extension integration which serves as the foundation for our Focus Flow Tracker. 
Things such as including webpack to build both popup and background scripts creating the proper manifest.json structure, etc.

**Background Service Worker:** Implemented a background script that tracks tab switching activity even when the popup is closed. 
What it does is that the background script reads messages from the popup (START_TRACKING, STOP_TRACKING, GET_STATUS) and maintains tracking state. 
Claude helped me implement the keep alive feature which ensures background script running even if extension is closed.

I also started the implementation of popup.html, popup.js, manifest.json, all three of these were fundamental for the working of our chrome extension.
