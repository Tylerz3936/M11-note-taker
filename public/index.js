let noteForm;
let noteTitle;
let noteText;
let saveNoteBtn;
let newNoteBtn;
let clearBtn;
let noteList;

if (window.location.pathname === '/notes' || window.location.pathname === '/') {
  noteForm = document.querySelector('.note-form');
  noteTitle = document.querySelector('.note-title');
  noteText = document.querySelector('.note-textarea');
  saveNoteBtn = document.querySelector('.save-note');
  newNoteBtn = document.querySelector('.new-note');
  clearBtn = document.querySelector('.clear-btn');
  noteList = document.querySelectorAll('#list-group');
}

// Show an element
const show = (elem) => {
  elem.style.display = 'inline';
};

// Hide an element
const hide = (elem) => {
  elem.style.display = 'none';
};

// activeNote is used to keep track of the note in the textarea
let activeNote = {};

// Get all notes from the db
const getNotes = () =>
  fetch('/api/notes', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json());

// Save a new note to the db
const saveNote = (note) =>
  fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
  }).then(response => response.json());

// Update an existing note in the db
const updateNote = (note) => {
  const url = `/api/notes/${note.id}`;
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => { throw new Error(text) });
    }
    return response.json();
  })
  .then(data => {
    console.log('Update response:', data);
    return data;
  })
  .catch(error => {
    console.error('Error updating note:', error);
  });
};

// Delete a note from the db
const deleteNote = (id) =>
  fetch(`/api/notes/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => response.json());

const renderActiveNote = () => {
  show(saveNoteBtn);
  show(clearBtn);

  if (activeNote.id) {
    show(newNoteBtn);
    noteTitle.removeAttribute('readonly', true);
    noteText.removeAttribute('readonly', true);
    noteTitle.value = activeNote.title;
    noteText.value = activeNote.text;
  } else {
    show(newNoteBtn);
    noteTitle.value = '';
    noteText.value = '';
  }
};

const handleNoteSave = () => {
  console.log('Save button clicked');
  const newNote = {
    title: noteTitle.value,
    text: noteText.value,
    id: activeNote.id
  };

  console.log('Note data to save:', newNote);

  if (activeNote.id) {
    console.log('Updating note:', newNote);
    updateNote(newNote).then(() => {
      activeNote = newNote;
      getAndRenderNotes();

      renderActiveNote();
    });
  } else {
    console.log('Saving new note:', newNote);
    saveNote(newNote).then(() => {
      getAndRenderNotes();
      activeNote = {};
      renderActiveNote();
    });
  }
};

// Delete the clicked note
const handleNoteDelete = (e) => {
  e.stopPropagation();

  const note = e.target;
  const noteId = JSON.parse(note.parentElement.getAttribute('data-note')).id;

  if (activeNote.id === noteId) {
    activeNote = {};
  }

  deleteNote(noteId).then(() => {
    getAndRenderNotes();
    renderActiveNote();
  });
};

// Sets the activeNote and displays it for editing
const handleNoteView = (e) => {
  e.preventDefault();
  activeNote = JSON.parse(e.target.parentElement.getAttribute('data-note'));
  noteTitle.removeAttribute('readonly');
  noteText.removeAttribute('readonly');
  renderActiveNote();
};

// Sets the activeNote to an empty object and allows the user to enter a new note
const handleNewNoteView = (e) => {
  activeNote = {};
  show(clearBtn);
  renderActiveNote();
};

// Renders the appropriate buttons based on the state of the form
const handleRenderBtns = () => {
  if (!noteTitle.value.trim() && !noteText.value.trim()) {
    hide(clearBtn);
    hide(saveNoteBtn);
  } else {
    show(clearBtn);
    show(saveNoteBtn);
  }
};

// Render the list of note titles
const renderNoteList = async (notes) => {
  let jsonNotes = await notes;
  if (window.location.pathname === '/notes' || window.location.pathname === '/') {
    noteList.forEach((el) => (el.innerHTML = ''));
  }

  let noteListItems = [];

  const createLi = (text, delBtn = true) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item');
  
    const spanEl = document.createElement('span');
    spanEl.classList.add('list-item-title');
    spanEl.innerText = text;
    spanEl.addEventListener('click', handleNoteView);
  
    liEl.append(spanEl);
  
    if (delBtn) {
      const delBtnEl = document.createElement('i');
      delBtnEl.classList.add(
        'fas',
        'fa-trash-alt',
        'float-right',
        'text-danger',
        'delete-note'
      );
      delBtnEl.addEventListener('click', handleNoteDelete);
  
      console.log('Creating delete button for:', text); // Debugging log
      liEl.append(delBtnEl);
    }
  
    console.log('List item created:', liEl); // Debugging log
    return liEl;
  };
  
  if (jsonNotes.length === 0) {
    noteListItems.push(createLi('No saved Notes', false));
  }

  jsonNotes.forEach((note) => {
    const li = createLi(note.title, true);
    li.dataset.note = JSON.stringify(note);

    noteListItems.push(li);
  });

  if (window.location.pathname === '/notes' || window.location.pathname === '/') {
    noteListItems.forEach((note) => noteList[0].append(note));
  }
};

// Gets notes from the db and renders them to the sidebar
const getAndRenderNotes = () => getNotes().then(renderNoteList);

if (window.location.pathname === '/notes' || window.location.pathname === '/') {
  saveNoteBtn.addEventListener('click', handleNoteSave);
  newNoteBtn.addEventListener('click', handleNewNoteView);
  clearBtn.addEventListener('click', renderActiveNote);
  noteForm.addEventListener('input', handleRenderBtns);
}

getAndRenderNotes();
