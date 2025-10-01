Name: Manihams Suraparaju

Netid: msurapar

Group name: Focus Flow Tracker

What I planned to do

* Build the popup interface using React

* Create a Site Blocker component where users can add/remove sites to block

* Add basic styling with CSS to make the popup look clean

What I did not do

* Add advanced styling/themes

What problems I encountered

* Webpack CSS import error: importing popup.css failed because no loader was configured. I fixed it by installing style-loader and css-loader and updating webpack config.

* State sync with Chrome APIs: getting live data (tab switches, tracking status) required experimenting with chrome.runtime.sendMessage and handling callbacks.

* Updating block rules: managing Chrome’s declarativeNetRequest rules was tricky because old rules needed to be removed before adding new ones.

Issues I worked on

* Implement React popup (popup.js) with Focus Tracker, Site Blocker, Notes components

* Create styling file (popup.css) and connect it into the build system

* Minor edits to background.js and popup.html to support new popup features

Files I worked on:

* FocusFlowTracker/src/popup.js

* FocusFlowTracker/src/popup.css

* FocusFlowTracker/src/popup.html

* FocusFlowTracker/src/background.js

Use of AI and/or 3rd party software

* Used Copilot for JSX boilerplate and React hooks autocomplete.

* Used ChatGPT to debug Webpack config and Chrome extension API issues.

What I accomplished

* Wrote the main React popup code (popup.js) with three working components (Focus Tracker, Site Blocker, Notes).

* Added popup.css to give the UI a modern, card-style layout.

* Integrated popup UI with Chrome APIs so that tracking status and blocked sites update dynamically.
