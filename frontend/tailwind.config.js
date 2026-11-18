/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4fa',
          100: '#dce6f5',
          200: '#bfd2ec',
          300: '#92b4df',
          400: '#5e8dce',
          500: '#396dbb',
          600: '#27539e',
          700: '#1f4180',
          800: '#162d59',
          900: '#0f1d3d',
          950: '#091229',
        },
        lab: {
          sky: '#38bdf8',
          blue: '#2563eb',
          green: '#22c55e',
          yellow: '#facc15',
          orange: '#fb923c',
          lavender: '#a78bfa',
          coral: '#fb7185',
          violet: '#7c3aed',
          cyan: '#0891b2',
          emerald: '#16a34a',
          amber: '#d97706',
          surface: '#f8fafc',
          ink: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Kannada', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 29, 61, 0.06), 0 4px 14px rgba(15, 29, 61, 0.04)',
        elevated: '0 10px 30px -10px rgba(15, 29, 61, 0.14)',
      },
    },
  },
  plugins: [],
};
