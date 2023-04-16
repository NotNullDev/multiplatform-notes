import { KeycloakProfile } from "keycloak-js";
import { z } from "zod";

export const NoteSchema = z.object({
  noteId: z.string().optional(),
  userId: z.string().optional(),
  noteTitle: z.string().min(1),
  noteContent: z.string().min(1),
  createdAt: z.date().optional(),
});

export type Note = z.infer<typeof NoteSchema>;
export type NoteOptional = Partial<Note>;

export type NotesStoreType = {
  notes: Note[];
  newNote: Partial<Note>;
  noteResetId: number; // used to reset NoteForm
};

export type User = KeycloakProfile;

export type UserStoreType = {
  user: User | undefined;
};
