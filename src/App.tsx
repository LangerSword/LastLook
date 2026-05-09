import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { applyTheme, initializeTheme, setStoredTheme, type Theme } from './lib/theme';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AppWorkspace from './pages/AppWorkspace';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/app/AppShell';
import MarketingLayout from './components/app/MarketingLayout';
import ReviewsPage from './pages/ReviewsPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import MemoryPage from './pages/MemoryPage';
import SettingsPage from './pages/SettingsPage';
import WalkthroughPage from './pages/WalkthroughPage';

export default function App() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = initializeTheme();
    setTheme(stored);
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as Theme | undefined;
      if (!detail) return;
      setTheme(detail);
    };
    window.addEventListener('lastlook-theme-change', handler as EventListener);
    return () => window.removeEventListener('lastlook-theme-change', handler as EventListener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    applyTheme(theme);
    setStoredTheme(theme);

    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    if (media.addEventListener) {
      media.addEventListener('change', handler);
    } else {
      media.addListener(handler);
    }
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handler);
      } else {
        media.removeListener(handler);
      }
    };
  }, [theme]);

  const handleThemeChange = (value: Theme) => {
    applyTheme(value);
    setStoredTheme(value);
    setTheme(value);
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <MarketingLayout theme={theme} onThemeChange={handleThemeChange}>
                <LandingPage />
              </MarketingLayout>
            }
          />
          <Route
            path="/auth"
            element={
              <MarketingLayout theme={theme} onThemeChange={handleThemeChange}>
                <AuthPage />
              </MarketingLayout>
            }
          />
          {/* Email verification / magic link callback */}
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Password Reset Flows */}
          <Route 
            path="/forgot-password" 
            element={
              <MarketingLayout theme={theme} onThemeChange={handleThemeChange}>
                <ForgotPasswordPage />
              </MarketingLayout>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <MarketingLayout theme={theme} onThemeChange={handleThemeChange}>
                <ResetPasswordPage />
              </MarketingLayout>
            } 
          />

          <Route
            path="/walkthrough"
            element={
              <MarketingLayout theme={theme} onThemeChange={handleThemeChange}>
                <WalkthroughPage />
              </MarketingLayout>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppShell theme={theme} onThemeChange={handleThemeChange} />
              </ProtectedRoute>
            }
          >
            <Route path="/app" element={<AppWorkspace />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/reviews/:id" element={<ReviewDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
