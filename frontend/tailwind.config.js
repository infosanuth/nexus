/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  safelist: [
    'bg-primary', // Add this line
  ],

  theme: {
    extend: {
      colors: {
        primary:"#5f6FFF",
      }
    },
  },
  plugins: [],
}