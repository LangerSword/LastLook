import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, PlusCircle, Database, Settings } from 'lucide-react';

const items = [
  { to: '/app', label: 'New', icon: PlusCircle },
  { to: '/reviews', label: 'Reviews', icon: FolderKanban },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/memory', label: 'Memory', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-edge bg-canvas/90 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-medium ${
                isActive ? 'bg-surface-muted text-ink' : 'text-ink-secondary'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
