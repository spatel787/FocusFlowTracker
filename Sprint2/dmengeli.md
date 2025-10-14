# Sprint 2

Name: Davyn Mengeling\
GitHub Handle: DMengeli04\
Group Name: FocusFlowTracker

### What you planned to do
My goal was to enhance the Notes feature, moving it to its own page, making it an editable text box, and allowing notes to be downloaded as a .txt file.

### What you did not do
I was fortunately able to complete everything I set out to accomplish by the expected deadline. 

### What problems you encountered
N/A

### Issues you worked on
- Move Notes feature to its own page https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/16
- Enhance Notes feature https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/17
- Add Download Notes feature https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/18

### Files you worked on
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/manifest.json
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/notes.js
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/notes.html
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/notes.css
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/popup.html
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/popup.js
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/webpack.config.js

### Use of AI and/or 3rd party software
AI was used to assist in the editing of all files. GitHub Copilot and ChatGPT in particular were used.

### What you accomplished
I created a dedicated Notes page for the Focus Flow Tracker extension by moving the notes feature into its own notes.html and notes.js files. The page includes a large editable text box that automatically saves content to Chrome’s local storage, ensuring notes persist even after closing the extension. The Notes page also syncs with the extension’s light and dark mode settings for consistent theming. Additionally, I added a “Download Notes” button that allows users to export their notes as a .txt file directly to their computer. The Notes page is accessible from the main popup through a dedicated button, making it easy for users to take, save, and download notes while staying within the extension’s workflow.
https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/33c548dbbbb90d64488b89dfe87ffb6c4ba5f5cf
https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/822e1fae27a0a3369414cc51d7bc053bd5e8b43f
