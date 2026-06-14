/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        summit: {
          bg: '#f4efe3',
          surface: '#fffaf0',
          surface2: '#e4dbc8',
          accent: '#ff5a1f',
          accent2: '#556b2f',
          success: '#3f7d3a',
          warn: '#c38b22',
          danger: '#b64032',
          ink: '#1f1913',
          muted: '#786e60',
          line: '#231a12',
          blush: '#ead0bd',
          mint: '#dde8cf',
          cream: '#fff6df',
          night: '#18130f',
          graphite: '#3c342c',
          paper: '#fbf2de',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
