import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

/**
 * Botón para alternar entre Light Mode y Dark Mode.
 * La preferencia se persiste en localStorage (clave: hazme-theme)
 * y se sincroniza entre pestañas.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="grid h-10 w-10 place-items-center rounded-lg border border-line-strong bg-card text-ink-mid transition-colors hover:bg-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
