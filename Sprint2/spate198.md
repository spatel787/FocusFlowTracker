# Sprint 2 Reflection

**Name:** Siddh Patel  
**GitHub ID:** spatel787  
**Group:** FocusFlowTracker  

---

## What You Planned to Do

In this sprint, I planned to work on the distraction warning system and create a separate full-page interface for the site blocking functionality. My goal was to enhance the user experience by moving the site blocker from the small popup window to a dedicated page, making it easier to manage distraction sites.

---

## What You Did Not Do

I successfully completed everything I had planned for this sprint. However, one limitation is that the current implementation uses a notification-based warning system rather than a hard blocking mechanism. This was an intentional design choice to align with our product requirements, which specify a "warning system rather than blocking websites outright." The extension now warns users when they visit flagged distraction sites instead of completely blocking access.

---

## Problems You Encountered

I encountered challenges learning advanced JavaScript concepts (particularly Chrome Extension APIs like chrome.notifications, chrome.tabs, and service worker architecture) and modern CSS styling techniques (CSS custom properties, responsive design patterns, and dark mode implementation).

To overcome these challenges, I:
- Used Claude AI to learn Chrome Extension architecture and React patterns
- Debugged issues with webpack configuration and build processes
- Learned how to properly structure Chrome Extension manifest v3
- Worked through notification permission and icon loading issues

---

## Issues You Worked On

1. Create a button for Site Blocker (#22)
   
2. Fix and implement warning system in background.js (#27)
   
3. Modify popup.js to work for distraction warning (#28)

---

## Files You Worked On
- src/background.js
- src/popup.js
- src/blocker.html
- src/blocker.css
- src/blocker.js
- manifest.json
- webpack.config.js

---

## Use of AI and 3rd Party Software

### AI Assistance (Claude)
- Learning: Used extensively to learn JavaScript, React, and Chrome Extension concepts
- Architecture: Got assistance understanding Chrome extension service worker architecture and API usage
- Implementation: Received help implementing, correcting, and reviewing code for background.js and popup.js
- Code Generation: Provided initial code for blocker.css and blocker.js
- Code Review: Helped fix and improve blocker.html for better structure and accessibility

### 3rd Party Software
- React 18.2.0 - UI framework for component-based interface
- Webpack 5.88.0 - Module bundler and build tooling
- Babel - JavaScript transpiler for modern syntax support
- Chrome Extension APIs - Built-in browser APIs (chrome.notifications, chrome.tabs, chrome.storage, chrome.runtime)

---

## What You Accomplished

I successfully implemented all features planned for this sprint:

1. Distraction Warning System
   - Implemented real-time URL monitoring in background service worker
   - Created smart notification system with 60-second cooldown to prevent spam

2. Full-Page Site Blocker
   - Built responsive, full-page interface for managing distraction sites

3. UI/UX Improvements
   - Added navigation buttons for seamless page transitions
