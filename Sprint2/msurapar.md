# Sprint 2

Name: Manihams Suraparaju  

Github id: Manihams

Group name: FocusFlowTracker

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

I used github copilot for css and js files to auto complete. I used chatgpt to assist me with fixing errors and organizing the stats page.

# What you accomplished

* Added a Working Stats Page

  - Successfully created a new stats.html page that loads and runs inside the extension.

  - The page can be opened directly from the extension popup using the new 📊 Stats button.

* Used the Chrome History API

  - Implemented logic in stats.js to fetch the user’s recent browsing history using chrome.history.search().

  - Retrieved and processed URLs, titles, and visit counts to analyze the user’s browsing patterns.

* Categorized Websites Automatically

  - Built a simple categorization system that organizes sites into Entertainment, Games, Social Networking, Shopping, Productivity, Generative AI, and Other based on their domain names.

  - This made the data easy to understand and visually meaningful.

* Integrated Chart.js for Visualization

  - Used Chart.js to display a pie chart of site categories by the number of visits.

  - The chart dynamically updates based on the user’s Chrome history.

* Added Browsing Summary Stats

  - Displayed additional stats, such as the top 5 most visited sites and the total number of sites in the browsing history.

  - This gives users a quick overview of their browsing habits.

* Improved User Interface

  - Styled the Stats Page (stats.css) to match the design of the rest of the extension.

  - Ensured that it loads cleanly and is easy to navigate.
  



