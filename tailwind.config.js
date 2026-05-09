/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface-rgb) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted-rgb) / <alpha-value>)',
        },
        edge: 'var(--border)',
        ink: {
          DEFAULT: 'rgb(var(--text-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
          muted: 'rgb(var(--text-soft-rgb) / <alpha-value>)',
          faint: 'rgb(var(--text-faint-rgb) / <alpha-value>)',
        },
        yc: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
          soft: 'rgb(var(--accent-rgb) / 0.14)',
        },
        ok: {
          DEFAULT: 'rgb(var(--success-rgb) / <alpha-value>)',
          soft: 'rgb(var(--success-rgb) / 0.16)',
        },
        warn: {
          DEFAULT: 'rgb(var(--warning-rgb) / <alpha-value>)',
          soft: 'rgb(var(--warning-rgb) / 0.16)',
        },
        err: {
          DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)',
          soft: 'rgb(var(--danger-rgb) / 0.16)',
        },
      },
      boxShadow: {
        soft: '0 4px 24px var(--shadow)',
        lift: '0 12px 40px var(--shadow)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'fade-up': 'fadeUp 0.4s ease-out forwards',
        'soft-pulse': 'softPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'progress-fill': 'progressFill 10s ease-out forwards',
        'pulse-emergency': 'pulseEmergency 1.4s ease-in-out infinite',
        'pulse-fast': 'pulseFast 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        softPulse: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        progressFill: { '0%': { width: '0%' }, '100%': { width: '90%' } },
        pulseEmergency: {
          '0%, 100%': { borderColor: 'var(--danger)', opacity: '0.6', boxShadow: '0 0 0 0 rgba(239,68,68,0)' },
          '50%': { borderColor: 'var(--danger)', opacity: '1', boxShadow: '0 0 0 4px rgba(239,68,68,0.15)' },
        },
        pulseFast: {
          '0%, 100%': { borderColor: 'var(--warning)', opacity: '0.5' },
          '50%': { borderColor: 'var(--warning)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
