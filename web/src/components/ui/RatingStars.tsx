import { Star } from 'lucide-react';

interface RatingStarsProps {
  /** Valor mostrado (0–5). Admite decimales para medias. */
  value: number;
  /** Si se pasa, el componente se vuelve interactivo (selector 1–5). */
  onChange?: (value: number) => void;
  size?: 'sm' | 'md';
  /** Número de valoraciones, para accesibilidad y texto auxiliar. */
  count?: number;
}

const SIZE_CLASS = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

/**
 * Estrellas de valoración.
 * - Modo lectura: pinta la media (decimales redondeados a la estrella más cercana).
 * - Modo interacción: cinco botones con etiquetas accesibles.
 */
export default function RatingStars({ value, onChange, size = 'sm', count }: RatingStarsProps) {
  const interactive = typeof onChange === 'function';
  const starClass = SIZE_CLASS[size];

  if (!interactive) {
    const rounded = Math.round(value);
    return (
      <span
        className="inline-flex items-center gap-1 text-accent-500"
        role="img"
        aria-label={`Valoración ${value.toFixed(1)} de 5${count != null ? ` (${count} valoraciones)` : ''}`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starClass} ${star <= rounded ? 'fill-current' : 'opacity-40'}`}
            aria-hidden="true"
          />
        ))}
        {count != null && (
          <span className="ml-1 text-xs font-medium text-muted">
            {value > 0 ? value.toFixed(1) : '—'}
            {count > 0 && ` (${count})`}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
          className={`rounded p-0.5 transition-colors hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            star <= value ? 'text-accent-500' : 'text-line-strong'
          }`}
        >
          <Star className={`${starClass} ${star <= value ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>
      ))}
    </span>
  );
}
