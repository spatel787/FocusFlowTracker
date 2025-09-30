# Sprint 1

Name: Davyn Mengeling\
GitHub Handle: DMengeli04\
Group Name: FocusFlowTracker\

### What you planned to do
My goal was to add working functionality for the Site Blocker feature which would allow the user to block specific websites that distract them.

### What you did not do
I was fortunately able to complete everything I set out to accomplish by the expected deadline. 

### What problems you encountered
There was one minor bug that I came across initially where one site in particular would remain accessible even after being blocked by our extension, however, this problem hasn't occurred on subsequent tests so I would consider it resolved.

### Issues you worked on
- Site Blocker Functionality part 1: Update popup.js https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/1
- Site Blocker Functinoality part 2: Update popup.html https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/2
- Site Blocker Functionality part 3: Update manifest.json https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/3

### Files you worked on
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/popup.js
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/popup.html
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/manifest.json
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/package.json
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/package-lock.json

### Use of AI and/or 3rd party software
AI was used to assist in the editing of all three files. GitHub Copilot and ChatGPT in particular were used.

### What you accomplished
I added a Site Blocker feature to the extension by creating a new React component that lets users manage a list of distracting sites (with some defaults like YouTube, TikTok and Reddit). This list is stored in Chrome's sync storage so it persists across sessions. Whenever the list changes, the extension uses Chrome's declarativeNetRequest API to update dynamic blocking rules, which prevent the browser from loading those sites in the main frame. To make this work, I also updated the manifest.json to include the correct permissions (storage, declarativeNetRequest, declarativeNetRequestFeedback, and <all_urls> host access). Finally, I adjusted the popup UI so users can add and remove sites interactively, and ensured the rules are actually applied by logging them in the popup console. In total, 157 lines of code were committed.
https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/7f13a31ed666447bd3736eb4b7924f40117cb4b1
