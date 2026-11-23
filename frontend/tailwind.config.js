/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
          light: '#FFE4E2'
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
      }
    },
  },
  plugins: [],
}
