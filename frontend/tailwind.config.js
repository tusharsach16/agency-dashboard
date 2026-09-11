/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: {
          dark: '#0a0a0b',
          light: '#fafaf9',
        },
        card: {
          dark: '#111113',
          darkHover: '#16171a',
          light: '#ffffff',
          lightHover: '#f4f4f5',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        teal: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        'soft-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.6)',
        'soft-light': '0 10px 25px -10px rgba(0, 0, 0, 0.06)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
}
