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

  // Download notes as .txt file
  const handleDownload = () => {
    if (!notes.trim()) {
      alert("No notes to download!");
      return;
    }

    const filename = `notes-${new Date()
      .toISOString()
      .slice(0, 10)}.txt`; // e.g., notes-2025-10-13.txt

    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className={`notes-container ${theme}`}>
      <div className="notes-buttons">
        <h1 className="header-title">Notepad</h1>
        <button className="download-btn" onClick={handleDownload}>
          💾 Download Notes
        </button>
      </div>
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
