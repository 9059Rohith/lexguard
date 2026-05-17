import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core backgrounds
        'bg-base': '#0A0A0F',
        'bg-surface': '#111118',
        'bg-elevated': '#18181F',
        'bg-overlay': '#1E1E28',
        // Accents
        gold: '#E8C547',
        'gold-dim': 'rgba(232,197,71,0.12)',
        'gold-hover': '#F0D060',
        danger: '#FF4444',
        'danger-dim': 'rgba(255,68,68,0.12)',
        warning: '#FF8C00',
        'warning-dim': 'rgba(255,140,0,0.12)',
        safe: '#00D084',
        'safe-dim': 'rgba(0,208,132,0.12)',
        blue: '#4D9EFF',
        'blue-dim': 'rgba(77,158,255,0.12)',
        // Text
        'text-primary': '#F0EDE8',
        'text-secondary': '#8A8A9A',
        'text-muted': '#4A4A5A',
        'text-gold': '#E8C547',
      },
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        body: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
        hover: 'rgba(255,255,255,0.12)',
        gold: 'rgba(232,197,71,0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan': 'scan 2.5s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(255,68,68,0.4)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 25px rgba(255,68,68,0.8)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
