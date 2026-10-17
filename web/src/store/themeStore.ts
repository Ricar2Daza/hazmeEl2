import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'hazme-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  // Se aplica en el primer render (el index.html ya lo aplicó antes del paint)
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
      return { theme: next };
    }),
}));

// Sincroniza entre pestañas/ventanas
if (typeof window !== 'undefined') {
  applyTheme(getInitialTheme());
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark')) {
      applyTheme(event.newValue);
      useThemeStore.setState({ theme: event.newValue });
    }
  });
}
