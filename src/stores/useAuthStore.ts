import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';
import { GitHubSession, GitHubHost, DEFAULT_HOSTS } from '../types/github';

interface AuthState {
  session: GitHubSession | null;
  hosts: GitHubHost[];
  setSession: (session: GitHubSession | null) => void;
  addHost: (host: GitHubHost) => void;
  removeHost: (hostId: string) => void;
  logout: () => void;
}

// Capacitor Preferences adapter for Zustand
const capacitorStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const { value } = await Preferences.get({ key: name });
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await Preferences.set({ key: name, value });
  },
  removeItem: async (name: string): Promise<void> => {
    await Preferences.remove({ key: name });
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hosts: DEFAULT_HOSTS,
      setSession: (session) => set({ session }),
      addHost: (host) => set((state) => ({ hosts: [...state.hosts, host] })),
      removeHost: (hostId) =>
        set((state) => ({
          hosts: state.hosts.filter((h) => h.id !== hostId),
        })),
      logout: () => set({ session: null }),
    }),
    {
      name: 'gitmobile-auth',
      storage: createJSONStorage(() => capacitorStorage as any),
    }
  )
);
