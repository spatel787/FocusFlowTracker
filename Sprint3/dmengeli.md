# Sprint 3

Name: Davyn Mengeling\
GitHub Handle: DMengeli04\
Group Name: FocusFlowTracker

### What you planned to do
My plans for this Sprint changed a lot from the initial planning process. My original plan was to do some code cleanup, but once one of my partners gave up a planned issue of his, I quickly pivoted and took upon that task. My job then was to create a Distraction Score component that would give the user a score based on certain distraction metrics that our extension recorded. I also fixed a bug that we were receiving a warning about.

### What you did not do
I was fortunately able to complete everything I set out to accomplish by the expected deadline. 

### What problems you encountered
We had some problems with our code breaking but eventually we were able to get those sorted.

### Issues you worked on
- Fix sizing issue https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/42
- Add Distraction Score component 0-100 https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/36
- Popup UI Cleanup https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/34

### Files you worked on
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/popup.js
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/stats.css
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/stats.js
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/src/popup.css
- https://github.com/utk-cs340-fall25/FocusFlowTracker/blob/main/webpack.config.js

### Use of AI and/or 3rd party software
AI was used to assist in the editing of all files. GitHub Copilot and ChatGPT in particular were used.

### What you accomplished
The first thing I did was fix an issue that had been giving us warnings. We were receiving these warnings when compiling because our stats.js file is 347 KiB, which exceeds Webpack's recommended 244 KiB limit. Because we're working on a chrome extension and not a website, the size won't be impacting us much. In fact, most Chrome extensions using React will have bundle sizes in this range. These warnings are more relevant for web applications where users download assets over the internet every time they visit. That being the case, I've written code to remedy this by adjusting the thresholds, thus removing the warnings. Next, I refined the FocusFlowTracker extension by introducing a Distraction Score feature and simplifying the popup UI for a cleaner, more focused experience. The Distraction Score provides a quick measure of user focus based on an equation that balances productive time against distractions. Specifically, it calculates a score out of 100 using the ratio of active time (in minutes) to the weighted sum of tab switches and distraction warnings — giving higher penalties for more frequent distractions. This means that longer focused sessions with fewer interruptions result in a higher score, while frequent tab-switching or visiting blocked sites lowers it. I also streamlined the popup interface to highlight just the essentials (current site, tracking button, and distraction score) and moved detailed metrics like time, tab switches, and warnings to the stats page.

- https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/409d67b58c7cb9fe729bed67cdca6272697598fb
- https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/8103f204b0c29b5871c09bf0778e50aa9a33a7f0
- https://github.com/utk-cs340-fall25/FocusFlowTracker/commit/262b99e913a83609d5fcc7dbb8a6bbd7eda8a498
