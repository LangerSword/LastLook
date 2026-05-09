import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, PlusCircle, BookOpenCheck, Database, Settings, FolderKanban } from 'lucide-react';

const navItems = [
  { to: '/app', label: 'New Review', icon: PlusCircle },
  { to: '/reviews', label: 'Reviews', icon: FolderKanban },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/memory', label: 'Memory', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/walkthrough', label: 'Walkthrough', icon: BookOpenCheck },
];

const getNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
    isActive
      ? 'bg-surface-muted text-ink border border-edge'
      : 'text-ink-secondary hover:text-ink hover:bg-surface-muted/60'
  }`;

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-edge bg-canvas/80 backdrop-blur-md sticky top-0 h-screen">
      <div className="p-6">
        <div className="text-[15px] font-semibold text-ink">LastLook</div>
        <div className="text-[11px] text-ink-muted mt-1">Application readiness</div>
      </div>
      <nav className="px-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={getNavClass}>
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-xl border border-edge bg-surface-muted p-3">
          <div className="text-[11px] font-mono text-ink-muted uppercase tracking-widest">tip</div>
          <p className="text-[12px] text-ink-secondary mt-2">
            Start a new review, then save it to build your dashboard history.
          </p>
        </div>
      </div>
    </aside>
  );
}
