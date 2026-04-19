'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_USERS = ['Eliza', 'Zoja', 'HevyTest'];

type UserContextType = {
  users: string[];
  activeUser: string;
  setActiveUser: (name: string) => void;
  addUser: (name: string) => void;
  deleteUser: (name: string) => void;
};

const UserContext = createContext<UserContextType>({
  users: DEFAULT_USERS,
  activeUser: DEFAULT_USERS[0],
  setActiveUser: () => {},
  addUser: () => {},
  deleteUser: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<string[]>(DEFAULT_USERS);
  const [activeUser, setActiveUserState] = useState<string>(DEFAULT_USERS[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedUsers = localStorage.getItem('pacepal_users');
    const savedActive = localStorage.getItem('pacepal_active_user');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers) as string[];
        // Merge: keep saved list but always include any new DEFAULT_USERS entries
        const merged = [...parsed, ...DEFAULT_USERS.filter(u => !parsed.includes(u))];
        if (merged.length) setUsers(merged);
      } catch (_) {}
    }
    if (savedActive) setActiveUserState(savedActive);
    setReady(true);
  }, []);

  const setActiveUser = (name: string) => {
    setActiveUserState(name);
    localStorage.setItem('pacepal_active_user', name);
  };

  const addUser = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUsers(prev => {
      const next = prev.includes(trimmed) ? prev : [...prev, trimmed];
      localStorage.setItem('pacepal_users', JSON.stringify(next));
      return next;
    });
    setActiveUser(trimmed);
  };

  const deleteUser = (name: string) => {
    if (users.length <= 1) return;
    const next = users.filter(u => u !== name);
    localStorage.setItem('pacepal_users', JSON.stringify(next));
    localStorage.removeItem(`pacepal_tracker_${name}`);
    setUsers(next);
    if (activeUser === name) {
      const fallback = next[0] ?? DEFAULT_USERS[0];
      setActiveUserState(fallback);
      localStorage.setItem('pacepal_active_user', fallback);
    }
  };

  // Persist user list changes
  useEffect(() => {
    if (ready) localStorage.setItem('pacepal_users', JSON.stringify(users));
  }, [users, ready]);

  return (
    <UserContext.Provider value={{ users, activeUser, setActiveUser, addUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
}
