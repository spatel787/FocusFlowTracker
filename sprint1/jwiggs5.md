# Sprint 1
Jeffrey Wiggs
jwiggs5
Focus Flow Tracker

### What you planned to do
1. [Add a stopwatch that runs in the background](https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/4)
2. [Create multiple instances of stopwatch in the extension](https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/5)

### What you did not do
1. [Create multiple instances of stopwatch in the extension](https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/5)

### What problems you encountered
Keeping the stopwatch running behind the scenes was difficult. The time keeping couldn't run well in the background  
so I had to figure out a way to store the start time so that the stopwatch could reboot and continue as though it had  
been running in the background the whole time. The first solution I tried was using the background service to store it  
because other parts of the code used that as a solution, but it didn't work. I eventually used session storage, but I  
also ran into issues with that because our storage had not been written. Alex wrote the storage background and altered  
my code to work with it.

### Issues you worked on
1. [Add a stopwatch that runs in the background](https://github.com/utk-cs340-fall25/FocusFlowTracker/issues/4)

### Files you worked on
1. FocusFlowTracker/src/background.js
2. FocusFlowTracker/src/popup.css
3. FocusFlowTracker/src/popup.js
4. FocusFlowTracker/src/popup.html

### Use of AI and/or 3rd party software
I used copilot extensively, mostly for it's auto complete functionality. I asked both copilot and  
ChatGPT for help and code, but the code never really worked. Some of the advice worked. I used code  
from https://medium.com/how-to-react/simple-way-to-create-a-stopwatch-in-react-js-bcc0e08e041e as a  
template for the stopwatch, but most of it has been changed by now.

### What you accomplished
I managed to get a stopwatch that (from a user perspective) continues running even when the extension is closed.  
Users can start, stop, continue, and reset the stopwatch and the state of it will be saved when the extension is  
closed.
