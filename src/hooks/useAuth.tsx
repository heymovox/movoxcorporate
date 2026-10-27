/**
 * Auth context.
 *
 * Holds the signed-in user and their role. The role is re-read from the API on
 * load rather than trusted from the stored token, so a role change applies on
 * the next page load instead of waiting for the JWT to expire.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Role } from '../lib/adminApi';
import { normaliseRole } from '../lib/rbac';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.heymovox.com';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  company: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  role: Role | null;
  login: (token: string, user: Omit<AdminUser, 'company'>) => void;
  logout: () => void;
  /** Re-fetch the current user (e.g. after a role change). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'admin_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/me`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('unauthorised');
      const data = await res.json();
      if (!data?.ok) throw new Error('unauthorised');
      setUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: normaliseRole(data.user.role),
        company: data.user.company ?? '',
      });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = (token: string, userData: Omit<AdminUser, 'company'>) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser({ ...userData, role: normaliseRole(userData.role), company: '' });
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, role: user?.role ?? null, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { AuthContext, api };