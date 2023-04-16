import { toast } from "react-hot-toast";
import { getNotes } from "./api";
import { notesStore } from "./App";

export async function refetchNotes() {
  try {
    const notes = await getNotes();
    notesStore.setState((state) => {
      state.notes = notes;
    });
    toast.success("Notes fetched");
  } catch (error) {
    toast.error(JSON.stringify(error, null, 4));
  }
}
