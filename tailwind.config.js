/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f0',
          100: '#dceddc',
          200: '#bbdbbb',
          300: '#8fc28f',
          400: '#5fa35f',
          500: '#3a7d34',
          600: '#2d6428',
          700: '#255021',
          800: '#1f401c',
          900: '#1a3518',
        },
        accent: {
          400: '#d4a853',
          500: '#c4952a',
          600: '#a67b1f',
          700: '#8a6414',
          800: '#6b4e0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
