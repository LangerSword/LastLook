import { Sun, Moon, Laptop } from 'lucide-react';
import type { Theme } from '../lib/theme';

interface ThemeToggleProps {
  value: Theme;
  onChange: (value: Theme) => void;
}

const icons = {
  light: Sun,
  dark: Moon,
  system: Laptop,
};

export default function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  const Icon = icons[value];
  const label = value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <label
      title="Theme"
      className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-surface hover:bg-surface-muted text-ink-secondary hover:text-ink text-[12px] font-medium rounded-lg border border-edge transition-all duration-200"
    >
      <Icon className="w-4 h-4" />
      <span className="hidden lg:inline">Theme</span>
      <select
        aria-label={`Theme: ${label}`}
        value={value}
        onChange={(event) => onChange(event.target.value as Theme)}
        className="bg-transparent text-ink text-[12px] font-medium outline-none cursor-pointer"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
