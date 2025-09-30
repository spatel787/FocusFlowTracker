// Wrapper on chrome.storage to make easy calls

// Manage blocked sites
// param url is a string
// get returns list of all blocked sites
export function blocked_add(url) {}
export function blocked_remove(url) {}
export function blocked_get() {}

// Used to store individual website usage time
// param url is a string
// get returns list of all websites visited

/*const ex-website = {
  tab-id: 1471247, // unique id
  root-domain: google.com,
  time-start: unixtime,
  time-end: unixtime,
};*/

export function history_add(url) {}
export function history_set_starttime(url) {}
export function history_set_endtime(url) {}
export function history_get() {}

// Manage notes
// param note is a string
// get returns list of all notes
export function notes_add(note) {}
export function notes_remove(note) {}
export function notes_get() {}
