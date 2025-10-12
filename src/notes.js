// New Notes Page - Davyn's Code
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./notes.css";

// ---------------- Notes App ----------------
function NotesApp() {
  const [notes, setNotes] = useState("");
  const [theme, setTheme] = useState("light"); // default theme

  // Load saved notes and theme from storage
  useEffect(() => {
    chrome.storage.local.get(["notesContent", "theme"], (result) => {
      if (result.notesContent) setNotes(result.notesContent);
      if (result.theme) setTheme(result.theme);
    });
  }, []);

  // Apply theme whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Save notes to storage whenever they change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setNotes(newValue);
    chrome.storage.local.set({ notesContent: newValue });
  };

  return (
    <div className={`notes-container ${theme}`}>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Write your notes here..."
        className={`notes-textarea ${theme}`}
      />
    </div>
  );
}

// ---------------- Render ----------------
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<NotesApp />);




