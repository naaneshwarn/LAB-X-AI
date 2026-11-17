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
          blue: '#2563eb',
          violet: '#6d28d9',
          cyan: '#0891b2',
          emerald: '#059669',
          amber: '#d97706',
          surface: '#f8fafc',
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
