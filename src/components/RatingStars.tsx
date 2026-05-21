import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number;
  onChange?: (val: number) => void;
  size?: number;
  interactive?: boolean;
}

export default function RatingStars({ value, onChange, size = 20, interactive = false }: RatingStarsProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const displayVal = hoverValue !== null ? hoverValue : value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => interactive && setHoverValue(star)}
          onMouseLeave={() => interactive && setHoverValue(null)}
          className={`transition-all duration-150 p-0.5 ${
            interactive ? 'cursor-pointer hover:scale-115 active:scale-95' : 'cursor-default'
          }`}
          style={{ width: size + 4, height: size + 4 }}
        >
          <Star
            size={size}
            className={`transition-colors duration-150 ${
              star <= displayVal
                ? 'fill-amber-400 text-amber-500'
                : 'fill-slate-100 text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
