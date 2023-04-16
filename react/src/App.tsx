import Keycloak, { KeycloakProfile } from "keycloak-js";
import React, { useEffect } from "react";
import { create, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

type User = KeycloakProfile;

type UserStoreType = {
  user: User | undefined;
};

const userStore = create<UserStoreType>()(
  immer((get, set, store) => {
    return {
      user: undefined,
    };
  })
);

type UserNoteType = {
  noteId: string;
  userId: string;
  noteTitle: string;
  noteContent: string;
  createdAt: Date;
};

type NotesStoreType = {
  notes: UserNoteType[];
  newNote: Partial<UserNoteType>;
};

const notesStore = create<NotesStoreType>()(
  immer((set, get, store) => {
    return {
      notes: [],
      newNote: {},
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

function NotesScreen() {
  const { newNote, notes } = useStore(notesStore);
  return (
    <>
      <div>Notes</div>
      <div className="flex gap-2 flex-col max-w-[50vw] mx-auto">
        <h2 className="text-3xl font-bold">New note</h2>
        <label className="flex gap-1 flex-col">
          <span>Title</span>
          <input className="input input-bordered" placeholder="Note title" />
        </label>
        <label className="flex gap-1 flex-col">
          <span>Content</span>
          <textarea
            rows={5}
            cols={2}
            className="textarea textarea-bordered resize-none"
            placeholder="Note content"
          />
        </label>
        <button className="btn btn-primary">Create</button>
      </div>
      <div className="flex flex-col gap-4">
        {notes.map((n) => {
          return (
            <div key={n.noteId} className="p-4">
              {n.noteTitle}
            </div>
          );
        })}
      </div>
    </>
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
  const { user } = useStore(userStore);
  useAuth();

  return (
    <div className="overflow-hidden h-screen">
      <AppHeader />
      {user && <NotesScreen />}
      {!user && <LoginScreen />}
    </div>
  );
}

export default App;
