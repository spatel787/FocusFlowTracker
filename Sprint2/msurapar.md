# Sprint 2

Manihams Suraparaju  msurapar

# What you planned to do

* Create Stats Page UI(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/29)

* Fetch and Categorize chrome history data(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/30)

* Visualize history data with chart.js(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/31)

# What problems you encountered

Data Not Displaying on the Page

Even after fetching the history data, nothing appeared on the Stats page.

The issue was that stats.js was not properly connected to stats.html, and Chrome extensions don’t allow certain script injections unless explicitly declared in the manifest.

Once stats.js was linked and permissions were fixed, the data started showing up.

Stats Button Not Appearing in Popup

Initially, the Stats button in popup.js was disabled or missing because the code only had a placeholder for it.

You had to add a working button that opened stats.html using chrome.runtime.getURL() and ensure it looked consistent with the other buttons.

# Issues you worked on

* Create Stats Page UI(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/29)
  
* Fetch and Categorize chrome history data(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/30)
  
* Visualize history data with chart.js(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/31)

# Files you worked on

* FocusFlowTracker/src/stats.css
  
* FocusFlowTracker/src/stats.html
  
* FocusFlowTracker/src/stats.js
  
* FocusFlowTracker/manifest.json

* FocusFlowTracker/webpack.config.js

* FocusFlowTracker/src/popup.js

# Use of AI

# What you accomplished
  



