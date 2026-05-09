import { Sun, Moon, Monitor } from 'lucide-react';
import type { Theme } from '../lib/theme';

interface ThemeToggleProps {
  value: Theme;
  onChange: (value: Theme) => void;
}

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

export default function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)]">
      {themes.map(({ value: themeValue, icon: Icon, label }) => {
        const isActive = value === themeValue;
        return (
          <button
            key={themeValue}
            onClick={() => onChange(themeValue)}
            title={label}
            aria-label={label}
            className={`relative p-1.5 rounded-md transition-all duration-200 ${
              isActive
                ? 'bg-[var(--surface)] text-[var(--accent)] shadow-sm'
                : 'text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--surface)]/50'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
