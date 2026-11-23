/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0F19',
          900: '#070A12',
          800: '#0B0F19',
          700: '#111827',
          600: '#1F2937'
        },
        navy: {
          DEFAULT: '#14213D',
          dark: '#0A1120',
          light: '#1E2F56',
          muted: '#2A3C6B'
        },
        pearl: {
          DEFAULT: '#F8F9FC',
          light: '#FFFFFF',
          dark: '#F1F3F9'
        },
        coral: {
          DEFAULT: '#FF6B5F',
          hover: '#FF5445',
          light: '#FFE4E2',
          glow: 'rgba(255, 107, 95, 0.4)'
        },
        aurora: {
          purple: '#8B5CF6',
          violet: '#7C3AED',
          indigo: '#6366F1',
          pink: '#EC4899',
          cyan: '#06B6D4',
          coral: '#FF6B5F',
          amber: '#F59E0B',
          emerald: '#10B981'
        },
        softgrey: {
          DEFAULT: '#E9EDF3',
          border: '#D8DEE9',
          light: '#F4F6F9'
        },
        success: {
          DEFAULT: '#16A36A',
          light: '#E2F7ED',
          dark: '#118153'
        },
        warning: {
          DEFAULT: '#E9A23B',
          light: '#FEF6E9',
          dark: '#C88526'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'glow-purple': '0 0 25px -3px rgba(139, 92, 246, 0.45)',
        'glow-coral': '0 0 25px -3px rgba(255, 107, 95, 0.45)',
        'glow-cyan': '0 0 25px -3px rgba(6, 182, 212, 0.45)',
        'glow-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.45)',
        'glow-indigo': '0 0 25px -3px rgba(99, 102, 241, 0.45)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'inner-light-subtle': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)'
      },
      animation: {
        'aurora-1': 'auroraMove1 18s ease-in-out infinite alternate',
        'aurora-2': 'auroraMove2 22s ease-in-out infinite alternate',
        'aurora-3': 'auroraMove3 15s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite'
      },
      keyframes: {
        auroraMove1: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(60px, -40px) scale(1.15)' },
          '100%': { transform: 'translate(-30px, 50px) scale(0.95)' }
        },
        auroraMove2: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '50%': { transform: 'translate(-70px, 30px) scale(1.2)' },
          '100%': { transform: 'translate(40px, -60px) scale(0.9)' }
        },
        auroraMove3: {
          '0%': { transform: 'translate(0px, 0px) scale(0.9)' },
          '50%': { transform: 'translate(40px, 40px) scale(1.1)' },
          '100%': { transform: 'translate(-50px, -20px) scale(1.05)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' }
        }
      }
    },
  },
  plugins: [],
}
