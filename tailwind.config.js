/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        summit: {
          bg: '#0f172a',
          surface: '#1e293b',
          surface2: '#334155',
          accent: '#38bdf8',
          accent2: '#22d3ee',
          success: '#34d399',
          warn: '#fbbf24',
          danger: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
