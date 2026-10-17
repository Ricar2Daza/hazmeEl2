import { Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';

type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'auto' | 'full' | 'mark';

interface LogoProps {
  /** Altura del logotipo */
  size?: LogoSize;
  /** Si se renderiza como enlace a la home */
  linked?: boolean;
  /**
   * auto -> lockup completo (≥ sm) e isotipo en pantallas pequeñas.
   * full -> siempre el lockup completo (isotipo + wordmark).
   * mark -> siempre el isotipo (sólo las manos).
   */
  variant?: LogoVariant;
  /** Clases extra para el contenedor externo (p. ej. utilidades responsive) */
  className?: string;
}

/** Altura del isotipo/lockup según tamaño (mobile-first). */
const HEIGHT: Record<LogoSize, string> = {
  sm: 'h-8',
  md: 'h-9',
  lg: 'h-11 sm:h-12',
};

// Dimensiones intrínsecas de los assets (evita layout shift / CLS).
const FULL_DIM = { w: 841, h: 176 };
const MARK_DIM = { w: 315, h: 280 };

/**
 * Logotipo de HazmeEl2.
 *
 * - Usa las imágenes de marca reales (`/brand/*.png`) con canal alfa real.
 * - Variante adaptativa: lockup completo en escritorio, isotipo en móvil.
 * - Cambia automáticamente entre la variante clara y oscura según el tema.
 */
export default function Logo({
  size = 'md',
  linked = true,
  variant = 'auto',
  className = '',
}: LogoProps) {
  const theme = useThemeStore((s) => s.theme);
  const suffix = theme === 'dark' ? '-dark' : '';

  const fullSrc = `/brand/logo-horizontal${suffix}.png`;
  const markSrc = `/brand/logo-mark${suffix}.png`;

  const showFull = variant !== 'mark';
  const showMark = variant !== 'full';
  const height = HEIGHT[size];

  // Para `auto`, el isotipo se oculta a partir de `sm` y el lockup se muestra.
  const fullVisibility = variant === 'auto' ? 'hidden sm:block' : 'block';
  const markVisibility = variant === 'auto' ? 'sm:hidden' : 'block';

  const content = (
    <span className={`inline-flex items-center ${className}`}>
      <span className="sr-only">HazmeEl2</span>
      {showFull && (
        <img
          src={fullSrc}
          alt=""
          width={FULL_DIM.w}
          height={FULL_DIM.h}
          draggable={false}
          decoding="async"
          className={`${height} w-auto ${fullVisibility}`}
        />
      )}
      {showMark && (
        <img
          src={markSrc}
          alt=""
          width={MARK_DIM.w}
          height={MARK_DIM.h}
          draggable={false}
          decoding="async"
          className={`${height} w-auto ${markVisibility}`}
        />
      )}
    </span>
  );

  if (linked) {
    return (
      <Link
        to="/"
        aria-label="HazmeEl2 — Inicio"
        className="inline-flex shrink-0 items-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {content}
      </Link>
    );
  }

  return content;
}
