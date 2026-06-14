/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        summit: {
          bg: '#f7f3ff',
          surface: '#ffffff',
          surface2: '#e7ddf7',
          accent: '#7c3aed',
          accent2: '#12a594',
          success: '#18a058',
          warn: '#f2b84b',
          danger: '#d84c65',
          ink: '#241344',
          muted: '#776b86',
          line: '#ddd2ef',
          blush: '#fff1e8',
          mint: '#e9faf4',
          cream: '#fff8e7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
