import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function Main_App() {
    const [notes, setNotes] = useState(['Buy groceries', 'Finish homework']);
    const [newNote, setNewNote] = useState('');

    const add_Note = () => {
        setNotes([...notes, newNote]);
        setNewNote('');
    };

    return (
        <div>
            <h1>Take a Quick Note</h1>
            <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
            />
            <button onClick={add_Note}>Add</button>
            <p>{notes.join(', ')}</p>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Main_App />);
