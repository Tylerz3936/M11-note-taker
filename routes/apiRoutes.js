const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
const { v1: uuidv1 } = require('uuid');
const router = express.Router();

const dbPath = path.join(__dirname, '../db/db.json');

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
    return readFileAsync(dbPath, 'utf8');
  },
  write(note) {
    return writeFileAsync(dbPath, JSON.stringify(note, null, 2));
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
  },
  updateNote(id, updatedNote) {
    return this.getNotes()
      .then((notes) => {
        const noteIndex = notes.findIndex(note => note.id === id);
        if (noteIndex !== -1) {
          notes[noteIndex] = updatedNote;
          return this.write(notes).then(() => updatedNote);
        } else {
          throw new Error('Note not found');
        }
      });
  }
};

// API Routes
router.get('/notes', (req, res) => {
  features.getNotes()
    .then((notes) => res.json(notes))
    .catch((err) => res.status(500).json({ error: 'Failed to get notes', details: err.message }));
});

router.post('/notes', (req, res) => {
  features.addNote(req.body)
    .then((note) => res.json(note))
    .catch((err) => res.status(500).json({ error: 'Failed to add note', details: err.message }));
});

router.delete('/notes/:id', (req, res) => {
  const noteId = req.params.id;
  features.removeNote(noteId)
    .then(() => res.json({ message: 'Note deleted successfully' }))
    .catch((err) => res.status(500).json({ error: 'Failed to delete note', details: err.message }));
});

// PUT route for updating notes
router.put('/notes/:id', (req, res) => {
  const noteId = req.params.id;
  const updatedNote = req.body;
  features.updateNote(noteId, updatedNote)
    .then((note) => res.json(note))
    .catch((err) => res.status(500).json({ error: 'Failed to update note', details: err.message }));
});

module.exports = router;
