# Sprint 3

Name: Manihams Suraparaju

Github id: manihams

Group name: FocusFlowTracker

# What you planned to do

* Stats page UI improvements(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/38)
* Display of most visited sites(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/44)
* Extra features to stats page(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/45)

# What problems you encountered

* Data Accuracy and Consistency
  - I had issues with my data not being reliable. The numbers I was getting from the API or database were inconsistent or sometimes just plain wrong. I spent time troubleshooting why my tracking methods were failing or why the data wasn't refreshing fast enough to show real-time stats.
* Performance and Loading Speed
  - The stats page loaded too slowly, especially for users with large amounts of data. I struggled with handling large datasets because they caused the browser to lag and freeze. I needed to implement techniques like data aggregation and pagination to keep the page snappy.
* Button functionality failures
  - Refresh button: I intended for this button to re-fetch the data from the source without reloading the entire page, but it simply did nothing when clicked, leaving the user with potentially stale statistics.
  - Import button: The button designed to trigger the file upload or data ingestion process wasn't properly linked to the backend logic. Clicking it did not open the file dialog or start the data transfer as it should have.
* Time functionality
  - Implemented the time feature at the end but it is currently not tracking time for each website so we have to work and fix the issue.
 
# Issues you worked on

* Stats page UI improvements(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/38)
* Display of most visited sites(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/44)
* Extra features to stats page(https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/45)

# Files you worked on

FocusFlowTracker/src/stats.css

FocusFlowTracker/src/stats.html

FocusFlowTracker/src/stats.js

FocusFlowTracker/manifest.json

FocusFlowTracker/webpack.config.js

FocusFlowTracker/src/popup.js

# Use of AI

* Fast Code: The AI gave me the starting code for the chart components and the complex data processing functions.

* Quick Debugging: When the buttons or the dark mode broke, I used AI to diagnose the errors in the JavaScript and suggest immediate fixes, saving me time.

# What you accomplished

Fixed Broken Features: I made sure the Light/Dark Mode now remembers your preference even after a refresh. I also fixed the Refresh Button so it correctly updates the data.

Built Visualizations: I created the main charts: the Daily Activity Bar Chart and the Category Pie Chart for breaking down usage.

Added Controls: I implemented time range filters and the Export (CSV/JSON) feature to let you download your data.

Improved Speed: I resolved the performance problems so the page loads faster and the charts don't cause lag.

  
