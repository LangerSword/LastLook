import { NavLink, useLocation } from 'react-router-dom';
import { PenSquare, FileText, BarChart2, Brain, Settings, Lightbulb, BookOpenCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/app', label: 'New Review', icon: PenSquare },
  { to: '/reviews', label: 'Reviews', icon: FileText },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/memory', label: 'Memory', icon: Brain },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/walkthrough', label: 'Walkthrough', icon: BookOpenCheck },
];

const getNavClass = ({ isActive }: { isActive: boolean }) =>
  `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all relative ${
    isActive
      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]'
  }`;

export default function Sidebar() {
  const { isSupabaseConfigured, isAuthenticated } = useAuth();
  const location = useLocation();

  const isOfflineMode = !isSupabaseConfigured || (!isAuthenticated);

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col sticky top-14 h-[calc(100vh-3.5rem)] border-r border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur-sm">
      <div className="p-4 pt-6">
        <NavLink
          to="/app"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white font-semibold text-[14px] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:translate-y-[-1px] active:translate-y-0 transition-all"
        >
          <PenSquare className="w-4 h-4" />
          New Review
        </NavLink>
      </div>

      <nav className="px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={getNavClass({ isActive })}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--accent)] rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[var(--accent)]' : ''}`} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className={`rounded-xl p-4 border transition-all ${
          isOfflineMode
            ? 'bg-gradient-to-br from-[var(--warning-soft)] to-transparent border-[var(--warning)]/30'
            : 'bg-[var(--surface-muted)] border-[var(--border)]'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className={`w-4 h-4 ${isOfflineMode ? 'text-[var(--warning)]' : 'text-[var(--text-faint)]'}`} />
            <span className={`text-[10px] font-mono uppercase tracking-widest ${isOfflineMode ? 'text-[var(--warning)]' : 'text-[var(--text-faint)]'}`}>
              {isOfflineMode ? 'Local Mode' : 'Pro Tip'}
            </span>
          </div>
          <p className={`text-[12px] leading-relaxed ${isOfflineMode ? 'text-[var(--text)]' : 'text-[var(--text-soft)]'}`}>
            {isOfflineMode
              ? 'LastLook runs locally. Your data stays on this device.'
              : 'Start a new review, then save it to build your dashboard history.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
