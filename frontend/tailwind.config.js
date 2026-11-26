/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Brand Color System (Section 2)
        brand: {
          navy: '#142D4E',        // Deep Navy (Brand identity, sidebar, headings)
          'navy-dark': '#0E2139',
          'navy-light': '#1E3E6B',
          ocean: '#256D85',       // Ocean Blue (Dominant Accent: links, nav selection, charts)
          'ocean-dark': '#1C5467',
          'ocean-light': '#368AA5',
          'ocean-soft': '#E6F0F4',
          amber: '#D97706',       // Amber (Primary CTA buttons, badges, key highlights)
          'amber-hover': '#B45309',
          'amber-light': '#F0A43A',
          'amber-soft': '#FEF3C7',
        },
        // Theme-responsive dynamic tokens
        surface: {
          DEFAULT: 'var(--color-surface)',
          subtle: 'var(--color-surface-subtle)',
          dark: '#1C2C40',
          light: '#FFFFFF'
        },
        app: {
          DEFAULT: 'var(--color-background)',
          dark: '#101B2B',
          light: '#F5F7FA'
        },
        content: {
          primary: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)'
        },
        borderline: 'var(--color-border)',
        
        // Semantic status colors
        status: {
          success: '#16A34A',
          'success-soft': '#DCFCE7',
          warning: '#D97706',
          'warning-soft': '#FEF3C7',
          danger: '#DC4C4C',
          'danger-soft': '#FEE2E2',
          info: '#3685D6',
          'info-soft': '#E0F2FE'
        },

        // Backward compatibility mappings (safely aligned with official palette)
        navy: {
          DEFAULT: '#142D4E',
          dark: '#0E2139',
          light: '#1E3E6B'
        },
        coral: {
          DEFAULT: '#D97706', // Aligned with Amber
          hover: '#B45309',
          light: '#FEF3C7',
          glow: 'rgba(217, 119, 6, 0.25)'
        },
        pearl: {
          DEFAULT: '#F5F7FA',
          light: '#FFFFFF',
          dark: '#E5EBF2'
        },
        softgrey: {
          DEFAULT: '#E5EBF2',
          border: '#CBD5E1',
          light: '#F8FAFC'
        },
        aurora: {
          purple: '#256D85', // Replaced with Ocean Blue
          violet: '#1C5467',
          indigo: '#142D4E',
          cyan: '#368AA5',
          coral: '#D97706',
          amber: '#D97706',
          emerald: '#16A34A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        hindi: ['Noto Sans Devanagari', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(20, 45, 78, 0.05), 0 1px 2px -1px rgba(20, 45, 78, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(20, 45, 78, 0.07), 0 2px 4px -2px rgba(20, 45, 78, 0.04)',
        'card-elevated': '0 10px 15px -3px rgba(20, 45, 78, 0.08), 0 4px 6px -4px rgba(20, 45, 78, 0.04)',
        'btn-amber': '0 2px 4px 0 rgba(217, 119, 6, 0.25)',
        'btn-ocean': '0 2px 4px 0 rgba(37, 109, 133, 0.25)',
        'glass': '0 4px 12px 0 rgba(20, 45, 78, 0.08)',
        'glow-purple': '0 0 15px 0 rgba(37, 109, 133, 0.25)',
        'glow-coral': '0 0 15px 0 rgba(217, 119, 6, 0.25)',
        'glow-emerald': '0 0 15px 0 rgba(22, 163, 74, 0.25)'
      }
    },
  },
  plugins: [],
}
