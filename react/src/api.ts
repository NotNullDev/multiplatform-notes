import dayjs from "dayjs";
import { Note, NoteSchema } from "./types";

export async function createNote(note: Partial<Note>) {
  const validatedNote = NoteSchema.parse(note);

  const response = await fetch("http://localhost:7777/notes", {
    method: "POST",
    headers: [["Content-Type", "application/json"]],
    body: JSON.stringify({
      ...validatedNote,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server returned status code ${response.status}`);
  }
}

export async function getNotes() {
  const response = await fetch("http://localhost:7777/notes");
  const notes = await response.json();

  if (!response.ok) {
    throw new Error(`Server returned status code ${response.status}`);
  }

  const validatedNotes = notes.map((note: any) => {
    if (note.createdAt) {
      note.createdAt = dayjs(note.createdAt).toDate();
    }
    return NoteSchema.parse(note);
  });

  return validatedNotes;
}

export async function deleteNote(noteId: string) {
  const response = await fetch(`http://localhost:7777/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Server returned status code ${response.status}`);
  }
}
