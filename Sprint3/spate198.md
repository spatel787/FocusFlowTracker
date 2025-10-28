# Sprint 3 Reflection

**Name:** Siddh Patel  
**GitHub ID:** spatel787  
**Group:** FocusFlowTracker  

---

## What You Planned to Do

In this sprint, I planned to work on creating an option to either block the site or give the user a warning. 

---

## What You Did Not Do
I planned to incorporate the score feature for this sprint but I wasn’t able to so I had to hand it to Davyn. My reasons are CS 360 midterm preparation as well other being occupied in volunteering work at the Hindu Community Center due to the season of Diwali.

---

## Problems You Encountered

Websites like YouTube.com are still not being blocked due to a URL pattern issue. I have tested and the blocking functionality works on every other website. I will have this issue fixed in the upcoming sprint.

Also, our tracker randomly stopped after ten minutes or so, and I had to manually wait several periods of fifteen-minute sessions to verify that the tracker did not stop working after I fixed the issue. The problem was the amount of time consumed to resolve just this one issue.

---

## Issues You Worked On

1. Create a Warn and Block option [#37](https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/1ec9a67f9575b014740b6ffabbae4bf038250666)
   
2. Fix the tracker randomly stopping. [#35](https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/d7080aacf7cce20b0adffe70c481dcb35af8252d)
   
3. Fix some websites not being blocked. [#43](https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/cae9ef31390d406fde8d52b658a1e687fa0a8c84)

---

## Files You Worked On
- src/background.js
- src/blocker.css
- src/blocker.js
- src/storage.js

---

## Use of AI and 3rd Party Software

### AI Assistance (Claude)
- Learning: Used extensively to learn JavaScript, React, and Chrome Extension concepts
- Architecture: Got assistance understanding Chrome extension service worker architecture, API usage, and learn how to prevent Chrome from resetting our extension’s states.
- Implementation: Received help implementing, correcting, partially generating, and reviewing code for background.js, storage.js, blocker.js and blocker.css.
- Code Review: Helped fix and improve my implementation.

---

## What You Accomplished

I successfully implemented all features except the Scoring one I planned for this sprint:

Now when the user opts to use the Site blocking functionality, they are prompted to select either   the “Warn” or “Block” option when adding a URL. This way it not only helps users not losing all the functionality, but it allows them to choose how they manage the site they find distractive.

I have also made sure our tracker does not randomly stop. The issue was that Chrome was killing our service worker to save resources so I opt to preserve the state which fixed the issue.
