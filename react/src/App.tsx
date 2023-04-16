import dayjs from "dayjs";
import Keycloak from "keycloak-js";
import React, { useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { create, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { createNote, deleteNote } from "./api";
import { refetchNotes } from "./api-utils";
import { NotesStoreType, User, UserStoreType } from "./types";

const userStore = create<UserStoreType>()(
  immer((get, set, store) => {
    return {
      user: undefined,
    };
  })
);

export const notesStore = create<NotesStoreType>()(
  immer((set, get, store) => {
    return {
      notes: [],
      newNote: {},
      noteResetId: 0,
    };
  })
);

const keycloack = new Keycloak({
  url: "http://localhost:8080",
  clientId: "notes",
  realm: "master",
});

keycloack.onActionUpdate = (action) => {
  console.log(action);
};

keycloack.onAuthSuccess = async () => {
  const profile = await keycloack.loadUserProfile();
  const user: User = profile;
  console.log(user);
  userStore.setState((state) => {
    state.user = user;
  });
};

keycloack.onAuthLogout = async () => {
  console.log("Logged out!");
};

function AppHeader() {
  const { user } = useStore(userStore);
  return (
    <>
      <div className="p-4 flex justify-between px-24">
        <button className="btn btn-ghost btn-sm">Notes app</button>
        {user && (
          <button
            className="btn btn-primary"
            onClick={() => {
              keycloack.logout({
                redirectUri: "http://localhost:5173",
              });
            }}
          >
            Logout
          </button>
        )}
      </div>
    </>
  );
}

function LoginScreen() {
  return (
    <div className="h-full flex flex-col items-center p-10">
      <button
        className="btn btn-primary"
        onClick={() => {
          keycloack.login();
        }}
      >
        Login with google
      </button>
    </div>
  );
}

function TrashIcon() {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="text-red-800 cursor-pointer active:scale-90 select-none hover:text-red-500"
      >
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        <line x1="10" x2="10" y1="11" y2="17"></line>
        <line x1="14" x2="14" y1="11" y2="17"></line>
      </svg>
    </>
  );
}

function NotesScreen() {
  const { notes, noteResetId } = useStore(notesStore);

  useEffect(() => {
    refetchNotes();
  }, []);

  return (
    <div className="overflow-hidden flex flex-col h-full " key={noteResetId}>
      <div className="flex gap-3 flex-col  w-[50vw] mx-auto overflow-y-hidden">
        <h2 className="text-3xl font-bold">New note</h2>
        <label className="flex gap-1 flex-col">
          <span>Title</span>
          <input
            key={noteResetId}
            className="input input-bordered"
            placeholder="Note title"
            onChange={(e) => {
              notesStore.setState((state) => {
                state.newNote.noteTitle = e.target.value;
              });
            }}
          />
        </label>
        <label className="flex gap-1 flex-col">
          <span>Content</span>
          <textarea
            key={noteResetId}
            rows={5}
            cols={2}
            className="textarea textarea-bordered resize-none"
            placeholder="Note content"
            onChange={(e) => {
              notesStore.setState((state) => {
                state.newNote.noteContent = e.target.value;
              });
            }}
          />
        </label>
        <button
          className="btn btn-primary"
          onClick={async () => {
            await createNote(notesStore.getState().newNote);
            toast.success("Note created!");
            notesStore.setState((state) => {
              state.noteResetId++;
            });
          }}
        >
          Create
        </button>
      </div>
      <div className="flex flex-col overflow-y-auto mt-10 gap-2">
        {notes.map((n) => {
          return (
            <div
              key={n.noteId}
              className="p-4 flex justify-between bg-base-200 rounded-md mx-auto w-[50vw] hover:bg-base-300 cursor-pointer"
            >
              <div className="flex">
                <div className="">{n.noteTitle}</div>
                <div className="ml-5 text-base-content/70">
                  {dayjs(n.createdAt).format("DD.MM.YYYY HH:mm")}
                </div>
              </div>
              <div
                onClick={async () => {
                  await deleteNote(n.noteId ?? "");
                  toast.success("Note deleted!");
                  notesStore.setState((state) => {
                    state.noteResetId++;
                  });
                  await refetchNotes();
                  toast.success("Note deleted!");
                }}
              >
                <TrashIcon />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useAuth() {
  const mounted = React.useRef<boolean>(false);

  useEffect(() => {
    if (mounted.current === true) return;
    mounted.current = true;

    keycloack
      .init({
        onLoad: "check-sso",
      })
      .then((s) => {
        console.log(s);
      });
  }, [mounted]);
}

function App() {
  const user = useStore(userStore);
  return (
    <>
      <AppHeader />
      {user && <NotesScreen />}
      {!user && <LoginScreen />}
      <Toaster />
    </>
  );
}

export default App;
