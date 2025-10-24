/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        medical: {
          red: '#dc2626',
          green: '#16a34a',
          yellow: '#d97706',
          blue: '#2563eb',
        }
      }
    },
  },
  plugins: [],
}