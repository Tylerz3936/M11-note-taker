const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const { v1: uuidv1 } = require('uuid');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));



const dbPath = path.join(__dirname, 'db', 'db.json');

// Promisify readFile and writeFile
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

// Load notes from db.json
let notes;
try {
  notes = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (error) {
  console.error('Error reading db.json:', error);
  notes = [];
}

// Features object
const features = {
  read() {
    return readFileAsync('./db/db.json', 'utf8');
  },

  write(note) {
    return writeFileAsync('./db/db.json', JSON.stringify(note, null, 2));
  },

  getNotes() {
    return this.read().then((notes) => {
      let parsedNotes;

      try {
        parsedNotes = [].concat(JSON.parse(notes));
      } catch (err) {
        parsedNotes = [];
      }

      return parsedNotes;
    });
  },

  addNote(note) {
    const { title, text } = note;

    if (!title || !text) {
      throw new Error("Note 'title' and 'text' cannot be blank");
    }

    const newNote = { title, text, id: uuidv1() };

    return this.getNotes()
      .then((notes) => [...notes, newNote])
      .then((updatedNotes) => this.write(updatedNotes))
      .then(() => newNote);
  },

  removeNote(id) {
    return this.getNotes()
      .then((notes) => notes.filter((note) => note.id !== id))
      .then((filteredNotes) => this.write(filteredNotes));
  }
};

// API Routes
app.get('/api/notes', (req, res) => {
  features.getNotes()
    .then((notes) => res.json(notes))
    .catch((err) => res.status(500).json({ error: 'Failed to get notes', details: err.message }));
});

app.post('/api/notes', (req, res) => {
  features.addNote(req.body)
    .then((note) => res.json(note))
    .catch((err) => res.status(500).json({ error: 'Failed to add note', details: err.message }));
});

app.delete('/api/notes/:id', (req, res) => {
  const noteId = req.params.id;
  notes = notes.filter(note => note.id !== noteId);

  fs.writeFile(dbPath, JSON.stringify(notes, null, 2), (err) => {
    if (err) {
      console.error('Error writing to db.json:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.json({ message: 'Note deleted successfully' });
  });
});



// Update note endpoint
app.put('/api/notes/:id', (req, res) => {
  const noteId = req.params.id;
  const updatedNote = req.body;
  console.log('Updating note with ID:', noteId);
  console.log('Updated note data:', JSON.stringify(updatedNote));

  let noteIndex = notes.findIndex(note => note.id === noteId);

  if (noteIndex !== -1) {
    notes[noteIndex] = updatedNote;
    console.log('Note updated successfully:', JSON.stringify(notes[noteIndex]));

    // Write updated notes array to db.json
    fs.writeFile(dbPath, JSON.stringify(notes, null, 2), (err) => {
      if (err) {
        console.error('Error writing to db.json:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      res.json(updatedNote);
    });
  } else {
    res.status(404).send('Note not found');
  }
});
  
// HTML Routes
app.get('/notes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/notes.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
