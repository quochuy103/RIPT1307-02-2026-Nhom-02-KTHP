import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface StoredUser extends User {
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
}

// ─── Storage helpers ─────────────────────────────────────────────────────────
const USERS_KEY = 'cc_users';
const SESSION_KEY = 'cc_session';

/** Seed admin account — always present in localStorage */
const SEED_ADMIN: StoredUser = {
  id: 'admin-001',
  name: 'Phạm Huy',
  email: 'phamhuy1032006@gmail.com',
  password: '103206@',
  role: 'admin',
};

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const users: StoredUser[] = raw ? JSON.parse(raw) : [];
    // Ensure seed admin is always present / up-to-date
    const withoutAdmin = users.filter((u) => u.id !== SEED_ADMIN.id);
    return [SEED_ADMIN, ...withoutAdmin];
  } catch {
    return [SEED_ADMIN];
  }
}

function saveUsers(users: StoredUser[]) {
  // Never overwrite seed admin's password/role from outside
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getSession());

  // Keep seed admin synced on every mount
  useEffect(() => {
    const users = getStoredUsers();
    saveUsers(users);
  }, []);

  /** Returns true on success, false if credentials wrong */
  const login = useCallback((email: string, password: string): boolean => {
    const users = getStoredUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!found) return false;

    const session: User = { id: found.id, name: found.name, email: found.email, role: found.role };
    saveSession(session);
    setUser(session);
    return true;
  }, []);

  /** Returns true on success, false if email already taken */
  const register = useCallback((name: string, email: string, password: string): boolean => {
    const users = getStoredUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role: 'user',
    };
    const updated = [...users, newUser];
    saveUsers(updated);

    const session: User = { id: newUser.id, name, email, role: 'user' };
    saveSession(session);
    setUser(session);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
